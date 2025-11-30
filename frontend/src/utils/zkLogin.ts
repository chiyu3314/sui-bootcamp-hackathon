import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { 
  generateNonce, 
  generateRandomness, 
  computeZkLoginAddress, 
  getZkLoginSignature,
  genAddressSeed 
} from '@mysten/zklogin';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'; 
import { fromHex } from '@mysten/sui/utils'; 
import { jwtDecode } from 'jwt-decode';

// ==========================================================
// CONFIG 設定區
// ==========================================================

const GOOGLE_CLIENT_ID = '898795728386-sc4vrcb8vmo0el33t22h8lbvagl1c0bl.apps.googleusercontent.com'.trim();
const REDIRECT_URI = 'http://localhost:5174'; 

// ★★★ 您的 Sponsor 私鑰 ★★★
const GAS_STATION_PRIVATE_KEY = 'suiprivkey1qzhaqgmqg7ac7u26azt8ycv3usxhcvynymw4xna4scjmunrf4lp9s5ha7jk'; 

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
const SETUP_DATA_KEY = 'zklogin_setup_data';

function getSponsorKeypair() {
  let key = GAS_STATION_PRIVATE_KEY;
  if (!key || key.includes('請替換成您的私鑰')) {
    console.warn("Sponsor 私鑰未設定");
    return null; 
  }
  key = key.trim();
  try {
    if (key.startsWith('suiprivkey')) {
      return Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(key).secretKey);
    } else {
      const cleanHex = key.replace(/^0x/, '');
      return Ed25519Keypair.fromSecretKey(fromHex(cleanHex));
    }
  } catch (e: any) {
    console.error("私鑰解析失敗:", e);
    return null;
  }
}

export function getSponsorAddress() {
  const keypair = getSponsorKeypair();
  return keypair ? keypair.toSuiAddress() : null;
}

export async function prepareGoogleLogin() {
  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const { epoch } = await suiClient.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + 2; 

  const nonce = generateNonce(
    ephemeralKeyPair.getPublicKey(),
    maxEpoch,
    randomness
  );

  sessionStorage.setItem(SETUP_DATA_KEY, JSON.stringify({
    ephemeralPrivateKey: ephemeralKeyPair.getSecretKey(),
    maxEpoch,
    randomness,
    nonce
  }));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'id_token',
    scope: 'openid email',
    nonce: nonce,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function handleZkLoginCallback(idToken: string) {
  const setupDataStr = sessionStorage.getItem(SETUP_DATA_KEY);
  if (!setupDataStr) throw new Error('Session 失效，請重新登入');
  
  const setupData = JSON.parse(setupDataStr);
  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(setupData.ephemeralPrivateKey);

  const decodedJwt = jwtDecode(idToken) as any;
  if (decodedJwt.nonce !== setupData.nonce) throw new Error('Nonce 驗證失敗');

  const userSalt = "12345678901234567890"; 

  // ★★★ 強制統一參數 (這是解決地址不一致的關鍵) ★★★
  // 我們不依賴 decodedJwt.aud (因為它可能是陣列或有差異)，直接用我們設定的 CLIENT_ID
  // 同樣，iss 也強制使用 Google 的標準網址
  const audValue = GOOGLE_CLIENT_ID;
  const issValue = 'https://accounts.google.com';

  console.log('計算地址參數:', { aud: audValue, iss: issValue, sub: decodedJwt.sub });

  // 1. 計算 Address Seed
  const addressSeed = genAddressSeed(
    BigInt(userSalt),
    'sub',
    decodedJwt.sub,
    audValue, 
    issValue
  ).toString();

  // 2. 計算 Address (參數必須與上面完全相同)
  const zkLoginAddress = computeZkLoginAddress({
    claimName: 'sub',
    claimValue: decodedJwt.sub,
    aud: audValue,
    iss: issValue,
    userSalt: BigInt(userSalt),
  });

  console.log('ZKLogin Address:', zkLoginAddress);

  const proofResponse = await fetch('https://prover-dev.mystenlabs.com/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt: idToken,
      extendedEphemeralPublicKey: ephemeralKeyPair.getPublicKey().toSuiPublicKey(),
      maxEpoch: setupData.maxEpoch,
      jwtRandomness: setupData.randomness,
      salt: userSalt,
      keyClaimName: 'sub', 
      keyExchange: 'mainnet', 
    }),
  });

  if (!proofResponse.ok) throw new Error(await proofResponse.text());
  const zkProof = await proofResponse.json();

  return {
    address: zkLoginAddress,
    addressSeed, 
    zkProof,
    maxEpoch: setupData.maxEpoch,
    ephemeralKeyPair,
    userSalt
  };
}

export async function executeZkTransaction(tx: Transaction, zkCredentials: any) {
  if (!zkCredentials || !zkCredentials.address) throw new Error('ZK Credentials 錯誤');

  const { address, zkProof, maxEpoch, ephemeralKeyPair, addressSeed } = zkCredentials;

  const sponsorKeypair = getSponsorKeypair();
  if (!sponsorKeypair) {
    alert('贊助者私鑰未設定！請檢查 src/utils/zkLogin.ts 第 21 行');
    throw new Error('Sponsor Key Error');
  }
  const sponsorAddress = sponsorKeypair.toSuiAddress();
  console.log(`Sponsor: ${sponsorAddress}`);

  tx.setSender(address); 
  tx.setGasOwner(sponsorAddress); 
  tx.setGasBudget(50_000_000); 

  const txBytes = await tx.build({ client: suiClient });

  const { signature: userSignature } = await ephemeralKeyPair.signTransaction(txBytes);
  const { signature: sponsorSignature } = await sponsorKeypair.signTransaction(txBytes);

  const zkSignature = getZkLoginSignature({
    inputs: {
      ...zkProof,
      addressSeed, 
    },
    maxEpoch,
    userSignature,
  });

  return await suiClient.executeTransactionBlock({
    transactionBlock: txBytes,
    signature: [zkSignature, sponsorSignature],
    options: { showEffects: true },
  });
}