import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Flex, Heading } from "@radix-ui/themes";
import { ChatRoom } from "./components/ChatRoom";

function App() {
  return (
    <>
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
      <ChatRoom />
    </>
  );
}