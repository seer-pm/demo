import { isAccessTokenExpired } from "@/lib/utils";
import { useAccount } from "wagmi";
import { useGlobalState } from "./useGlobalState";

export const useIsAccountConnected = () => {
  const { isConnected } = useAccount();

  return isConnected;
};

export const useIsConnectedAndSignedIn = () => {
  const isAccountConnected = useIsAccountConnected();
  const accessToken = useGlobalState((state) => state.accessToken);

  return isAccountConnected && !isAccessTokenExpired(accessToken);
};
