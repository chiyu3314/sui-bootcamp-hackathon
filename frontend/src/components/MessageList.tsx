import { Box, Card, Text, Flex } from "@radix-ui/themes";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Message {
  sender: string;
  text: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
  currentUser: string;
}

export function MessageList({ messages, currentUser }: MessageListProps) {
  return (
    <Box
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "1rem",
        background: "var(--gray-a2)",
        borderRadius: "var(--radius-3)",
      }}
    >
      {messages.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: "100%" }}>
          <Text color="gray">還沒有訊息，開始聊天吧！</Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="3">
          {messages.map((message, index) => {
            const isOwnMessage = message.sender === currentUser;
            const messageDate = new Date(message.timestamp);

            return (
              <Flex
                key={index}
                justify={isOwnMessage ? "end" : "start"}
                style={{ width: "100%" }}
              >
                <Card
                  style={{
                    maxWidth: "70%",
                    padding: "0.75rem 1rem",
                    background: isOwnMessage
                      ? "var(--accent-9)"
                      : "var(--gray-3)",
                    color: isOwnMessage ? "white" : "var(--gray-12)",
                  }}
                >
                  <Flex direction="column" gap="1">
                    {!isOwnMessage && (
                      <Text size="1" weight="bold" style={{ opacity: 0.8 }}>
                        {message.sender.slice(0, 8)}...
                        {message.sender.slice(-6)}
                      </Text>
                    )}
                    <Text size="3">{message.text}</Text>
                    <Text
                      size="1"
                      style={{
                        opacity: 0.7,
                        marginTop: "0.25rem",
                      }}
                    >
                      {formatDistanceToNow(messageDate, {
                        addSuffix: true,
                        locale: zhTW,
                      })}
                    </Text>
                  </Flex>
                </Card>
              </Flex>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}

