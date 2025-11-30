import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import {
  Dialog,
  Button,
  TextField,
  Flex,
  Text,
  Avatar,
} from "@radix-ui/themes";
import { CHAT_CONTRACT_PACKAGE_ID } from "../config";
import { Transaction } from "@mysten/sui/transactions";

interface UserProfileProps {
  onProfileUpdate: () => void;
}

export function UserProfile({ onProfileUpdate }: UserProfileProps) {
  const account = useCurrentAccount();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  // 查找用戶的 Profile 對象
  const { data: ownedObjects } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        StructType: `${CHAT_CONTRACT_PACKAGE_ID}::chat_contract::Profile`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account && CHAT_CONTRACT_PACKAGE_ID !== "0x0",
    }
  );

  useEffect(() => {
    if (ownedObjects?.data && ownedObjects.data.length > 0) {
      const profile = ownedObjects.data[0];
      if (profile.data?.objectId) {
        setProfileId(profile.data.objectId);
        if (
          profile.data.content &&
          "fields" in profile.data.content
        ) {
          const fields = profile.data.content.fields as any;
          setUsername(fields.username || "");
          setAvatarUrl(fields.avatar_url || "");
        }
      }
    } else {
      setProfileId(null);
    }
  }, [ownedObjects]);

  const handleCreateOrUpdate = () => {
    if (!account || !username.trim() || CHAT_CONTRACT_PACKAGE_ID === "0x0") {
      return;
    }

    const tx = new Transaction();

    if (profileId) {
      // 更新現有 Profile
      tx.moveCall({
        target: `${CHAT_CONTRACT_PACKAGE_ID}::chat_contract::update_profile`,
        arguments: [
          tx.object(profileId),
          tx.pure.string(username),
          tx.pure.string(avatarUrl || ""),
        ],
      });
    } else {
      // 創建新 Profile
      tx.moveCall({
        target: `${CHAT_CONTRACT_PACKAGE_ID}::chat_contract::create_profile`,
        arguments: [tx.pure.string(username), tx.pure.string(avatarUrl || "")],
      });
    }

    signAndExecute(
      {
        transaction: tx,
        chain: "sui:testnet",
      },
      {
        onSuccess: () => {
          setOpen(false);
          onProfileUpdate();
        },
        onError: (error: Error) => {
          console.error("操作失敗:", error);
          alert("操作失敗: " + error.message);
        },
      }
    );
  };

  if (!account) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="soft" size="2">
          {username ? (
            <Flex align="center" gap="2">
              {avatarUrl && <Avatar src={avatarUrl} size="1" fallback={username[0] || "U"} />}
              <Text>{username}</Text>
            </Flex>
          ) : (
            "Settings"
          )}
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>User Profile</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Set your username and avatar
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Username
            </Text>
            <TextField.Root
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Avatar URL (optional)
            </Text>
            <TextField.Root
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </label>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleCreateOrUpdate}
              disabled={isPending || !username.trim()}
            >
              {isPending ? "Processing..." : profileId ? "Update" : "Create"}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

