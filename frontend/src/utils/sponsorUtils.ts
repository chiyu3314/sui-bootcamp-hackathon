import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { SPONSOR_PRIVATE_KEY } from "../config";

/**
 * 管理者贊助交易工具
 * ⚠️ 安全警告：這會使用管理者的私鑰簽署交易，請確保：
 * 1. 私鑰存儲在 .env.local 中，不要提交到 Git
 * 2. 管理者錢包只存放少量 SUI 代幣
 * 3. 僅在測試環境使用，或確保私鑰安全
 */

/**
 * 使用管理者賬戶簽署並執行交易
 * @param tx 要執行的交易
 * @param client Sui 客戶端
 * @returns 交易結果
 */
export async function executeSponsoredTransaction(
  tx: Transaction,
  client: SuiClient
) {
  if (!SPONSOR_PRIVATE_KEY) {
    throw new Error(
      "未配置管理者私鑰。請在 .env.local 中設置 VITE_SPONSOR_PRIVATE_KEY"
    );
  }

  try {
    // 從私鑰創建 Keypair
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(
      SPONSOR_PRIVATE_KEY
    );

    // 設置交易的 sender
    tx.setSender(sponsorKeypair.toSuiAddress());

    // 簽署並執行交易
    const txBytes = await tx.build({ client });
    const signature = await sponsorKeypair.signTransaction(txBytes);

    const result = await client.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature.signature,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    return result;
  } catch (error) {
    console.error("管理者贊助交易失敗:", error);
    throw error;
  }
}

/**
 * 檢查管理者賬戶餘額
 * @param client Sui 客戶端
 * @returns 餘額（MIST 單位）
 */
export async function checkSponsorBalance(
  client: SuiClient
): Promise<bigint> {
  if (!SPONSOR_PRIVATE_KEY) {
    return BigInt(0);
  }

  try {
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(
      SPONSOR_PRIVATE_KEY
    );
    const sponsorAddress = sponsorKeypair.toSuiAddress();

    const balance = await client.getBalance({
      owner: sponsorAddress,
    });

    return BigInt(balance.totalBalance);
  } catch (error) {
    console.error("檢查管理者餘額失敗:", error);
    return BigInt(0);
  }
}

/**
 * 獲取管理者地址
 * @returns 管理者地址
 */
export function getSponsorAddress(): string {
  if (!SPONSOR_PRIVATE_KEY) {
    return "";
  }

  try {
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(
      SPONSOR_PRIVATE_KEY
    );
    return sponsorKeypair.toSuiAddress();
  } catch (error) {
    console.error("獲取管理者地址失敗:", error);
    return "";
  }
}

