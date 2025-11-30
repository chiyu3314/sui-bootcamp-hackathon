import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    localnet: {
      url: getFullnodeUrl("localnet"),
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };