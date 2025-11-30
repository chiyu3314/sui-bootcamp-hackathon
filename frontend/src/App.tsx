import { useEffect, useMemo, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Separator, Dialog, Button } from "@radix-ui/themes";
import { ChatRoom } from "./components/ChatRoom";
import { CHAT_ROOM_OBJECT_ID } from "./config";

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { ZKLoginProvider, ZKLogin, useZKLogin } from "react-sui-zk-login-kit";
import { generateRandomness } from "@mysten/sui/zklogin";

type Room = {
  id: string;
  name: string;
};

const GOOGLE_CLIENT_ID = "73850711498-hk92uj0bn8ve6or94ktksgnupas877t4.apps.googleusercontent.com";
const FULLNODE_URL = getFullnodeUrl("testnet");
const suiClient = new SuiClient({ url: FULLNODE_URL });
const SUI_PROVER_ENDPOINT = "https://prover-dev.mystenlabs.com/v1";

const providers = {
  google: {
    clientId: GOOGLE_CLIENT_ID,
    redirectURI: window.location.origin,
  },
};

function ChatApp() {
  const [rooms] = useState<Room[]>([
    {
      id: CHAT_ROOM_OBJECT_ID,
      name: "一般聊天室",
    },
    {
      id: "room-2",
      name: "技術討論",
    },
    {
      id: "room-3",
      name: "閒聊區",
    },
  ]);

  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0].id);
  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0];
  
  // ✅ 控制問候彈窗
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState({ method: "", address: "" });

  // ✅ 從 dApp Kit 抓錢包帳號
  const currentWalletAccount = useCurrentAccount();

  // ✅ 從 zkLogin 取得狀態
  const {
    encodedJwt,
    address: zkAddress,
    userSalt,
    setUserSalt,
  } = useZKLogin();

  // ✅ 第一次拿到 JWT 時，生成 salt 並存到 localStorage
  useEffect(() => {
    if (!encodedJwt) return;

    const key = "zklogin_user_salt";
    let salt = localStorage.getItem(key);
    if (!salt) {
      salt = generateRandomness();
      localStorage.setItem(key, String(salt));
    }
    if (userSalt !== salt) {
      setUserSalt(String(salt));
    }
  }, [encodedJwt, userSalt, setUserSalt]);

  // ✅ 統一「目前使用中的 address」：優先 zkLogin，其次錢包
  const currentAddress = useMemo(
    () => zkAddress ?? currentWalletAccount?.address ?? null,
    [zkAddress, currentWalletAccount]
  );

  // ✅ 檢查是否已登入（Google zkLogin 或錢包連接）
  const isLoggedIn = !!currentAddress;

  // ✅ 連接錢包時顯示問候訊息
  useEffect(() => {
    if (currentAddress) {
      const loginMethod = zkAddress ? "Google" : "錢包";
      const shortAddress = `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`;
      
      setWelcomeInfo({ method: loginMethod, address: shortAddress });
      setShowWelcomeDialog(true);
    }
  }, [currentAddress, zkAddress]);

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* 問候彈窗 */}
      <Dialog.Root open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>
            <Flex align="center" gap="2">
              <Text size="6">🎉</Text>
              <Text>歡迎回來！</Text>
            </Flex>
          </Dialog.Title>
          <Dialog.Description size="2" mb="4">
            您已成功連接到Chat on Chain
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <Box>
              <Text as="div" size="2" weight="bold" mb="1">
                登入方式
              </Text>
              <Text as="div" size="2" color="gray">
                {welcomeInfo.method === "Google" ? "🔐 Google 帳號" : "👛 錢包連接"}
              </Text>
            </Box>

            <Box>
              <Text as="div" size="2" weight="bold" mb="1">
                您的地址
              </Text>
              <Text 
                as="div" 
                size="2" 
                style={{ 
                  fontFamily: "monospace",
                  background: "var(--gray-3)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                }}
              >
                {welcomeInfo.address}
              </Text>
            </Box>

            <Box
              style={{
                background: "var(--blue-3)",
                padding: "12px",
                borderRadius: "8px",
                borderLeft: "3px solid var(--blue-9)",
              }}
            >
              <Text size="2">
                💡 您現在可以開始與其他用戶聊天了！
              </Text>
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button size="3" variant="solid">
                開始使用
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* 上方 navbar */}
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
          zIndex: 1000,
          background: "var(--gray-1)",
        }}
      >
        <Box>
          <Heading>Chat on Chain</Heading>
        </Box>

        <Box
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Google zkLogin 按鈕 */}
          <ZKLogin
            providers={providers}
            proverProvider={SUI_PROVER_ENDPOINT}
            title={zkAddress ? "切換 Google 帳號" : "Google 登入"}
            subTitle="使用 Google 帳號產生 Sui zkLogin address"
          />

          {/* 錢包連接按鈕 */}
          <ConnectButton />

          {/* ✅ 顯示目前登入狀態 */}
          {currentAddress && (
            <Text size="2" color="gray">
              {zkAddress ? "✓ Google 登入" : "✓ 錢包已連接"}
            </Text>
          )}
        </Box>
      </Flex>

      {/* ✅ 檢查是否登入 */}
      {!isLoggedIn ? (
        <Flex
          justify="center"
          align="center"
          style={{
            height: "calc(100vh - 56px)",
            background: "var(--gray-2)",
          }}
        >
          <Box style={{ textAlign: "center" }}>
            <Heading size="5" mb="3">
              請登入以使用聊天室
            </Heading>
            <Text color="gray">
              點擊右上角「Google 登入」或「Connect」按鈕連接你的帳戶
            </Text>
          </Box>
        </Flex>
      ) : (
        <Flex style={{ height: "calc(100vh - 56px)" }}>
          {/* 左側：聊天室列表 */}
          <Box
            style={{
              width: 220,
              borderRight: "1px solid var(--gray-a3)",
              background: "var(--gray-2)",
              overflowY: "auto",
            }}
          >
            <Box p="3">
              <Text
                weight="bold"
                style={{
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: "23px",
                }}
              >
                聊天室列表
              </Text>
            </Box>

            {/* 第一個房間 */}
            <Box
              px="3"
              py="2"
              style={{
                cursor: "pointer",
                background:
                  rooms[0].id === activeRoomId ? "var(--gray-4)" : "transparent",
              }}
              onClick={() => setActiveRoomId(rooms[0].id)}
            >
              <Text>{rooms[0].name}</Text>
            </Box>

            {/* 分隔線 */}
            <Separator my="2" />

            {/* 第二個房間 */}
            <Box
              px="3"
              py="2"
              style={{
                cursor: "pointer",
                background:
                  rooms[1].id === activeRoomId ? "var(--gray-4)" : "transparent",
              }}
              onClick={() => setActiveRoomId(rooms[1].id)}
            >
              <Text>{rooms[1].name}</Text>
            </Box>

            {/* 分隔線 */}
            <Separator my="2" />

            {/* 第三個房間 */}
            <Box
              px="3"
              py="2"
              style={{
                cursor: "pointer",
                background:
                  rooms[2].id === activeRoomId ? "var(--gray-4)" : "transparent",
              }}
              onClick={() => setActiveRoomId(rooms[2].id)}
            >
              <Text>{rooms[2].name}</Text>
            </Box>
          </Box>

          {/* 右側：目前選到的聊天室內容 */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <ChatRoom
              roomId={activeRoom.id}
              roomName={activeRoom.name}
            />
          </Box>
        </Flex>
      )}
    </div>
  );
}

// ✅ 保留 ZKLoginProvider
export default function App() {
  return (
    <ZKLoginProvider client={suiClient}>
      <ChatApp />
    </ZKLoginProvider>
  );
}
