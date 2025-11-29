import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Text, Card } from "@radix-ui/themes";
import { MessageList } from "./MessageList";
import { SendMessage } from "./SendMessage";
import { UserProfile } from "./UserProfile";
import { CHAT_ROOM_OBJECT_ID } from "../config";
import { useEffect, useState } from "react";

interface Message {
  sender: string;
  text: string;
  timestamp: number;
}

export function ChatRoom() {
  const account = useCurrentAccount();
  const [messages, setMessages] = useState<Message[]>([]);

  // 讀取 ChatRoom 對象
  const { data: chatRoomData, refetch } = useSuiClientQuery(
    "getObject",
    {
      id: CHAT_ROOM_OBJECT_ID,
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: CHAT_ROOM_OBJECT_ID !== "0x0",
      refetchInterval: 3000, // 每 3 秒刷新一次
    }
  );

  useEffect(() => {
    if (chatRoomData?.data?.content && "fields" in chatRoomData.data.content) {
      const fields = chatRoomData.data.content.fields as any;
      if (fields.messages && Array.isArray(fields.messages)) {
        const parsedMessages: Message[] = fields.messages.map((msg: any) => ({
          sender: msg.fields?.sender || msg.sender || "",
          text: msg.fields?.text || msg.text || "",
          timestamp: Number(msg.fields?.timestamp || msg.timestamp || 0),
        }));
        setMessages(parsedMessages);
      }
    }
  }, [chatRoomData]);

  if (!account) {
    return (
      <Container>
        <Card style={{ padding: "1rem" }}>
          <Text>請先連接錢包以使用聊天室</Text>
        </Card>
      </Container>
    );
  }

  if (CHAT_ROOM_OBJECT_ID === "0x0") {
    return (
      <Container>
        <Card style={{ padding: "1rem" }}>
          <Text color="red">
            請在 .env 文件中設置 VITE_CHAT_ROOM_ID
          </Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="3" p="4" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <Flex 
        direction="column" 
        gap="4" 
        style={{ 
          height: "calc(100vh - 80px)",
          maxHeight: "800px",
          minHeight: "500px"
        }}
      >
        {/* 標題和用戶資料 */}
        <Flex justify="between" align="center" style={{ flexShrink: 0 }}>
          <Heading size="6">聊天室</Heading>
          <UserProfile onProfileUpdate={() => refetch()} />
        </Flex>

        {/* 訊息列表 */}
        <Box style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          <MessageList messages={messages} currentUser={account.address} />
        </Box>

        {/* 發送訊息 */}
        <Box style={{ flexShrink: 0 }}>
          <SendMessage
            onMessageSent={() => {
              refetch();
            }}
          />
        </Box>
      </Flex>
    </Container>
  );
}

