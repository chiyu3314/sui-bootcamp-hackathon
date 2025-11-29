import { useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Separator } from "@radix-ui/themes";
import { ChatRoom } from "./components/ChatRoom";
import { CHAT_ROOM_OBJECT_ID } from "./config";

type Room = {
  id: string;
  name: string;
};

function App() {
    const [rooms] = useState<Room[]>([
      {
        id: CHAT_ROOM_OBJECT_ID,
        name: "一般聊天室",
      },
      {
        id: "room-2",  // ✅ 改為唯一識別符
        name: "技術討論",
      },
      {
        id: "room-3",  // ✅ 改為唯一識別符
        name: "閒聊區",
      },
    ]);

    const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0].id);
    const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? rooms[0];

    return (
      <div style={{ background: "rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(10px)"
                  }}>
        {/* 上方 navbar */}
        <Flex
          position="sticky"
          px="4"
          py="2"
          justify="between"
          style={{
            borderBottom: "1px solid var(--gray-a2)",
            zIndex: 1000,
            background: "var(--gray-1)",
          }}
        >
          <Box>
            <Heading>聊天室 dApp</Heading>
          </Box>

          <Box>
            <ConnectButton />
          </Box>
        </Flex>

        {/* 左右 layout */}
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
            {activeRoom.id === CHAT_ROOM_OBJECT_ID ? (
              <ChatRoom roomId={activeRoom.id} roomName={activeRoom.name} />
            ) : (
              <Box
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Text size="5" weight="bold" color="gray">
                  {activeRoom.name} 已關閉，支付100usdc開啟。
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </div>
    );
}

export default App;
