import { isAccessTokenExpired } from "@/lib/utils";
import { useAccount } from "wagmi";
import useCheckAccount from "./useCheckAccount";
import { useGlobalState } from "./useGlobalState";

export const useIsConnectedAndSignedIn = () => {
  const { isConnected } = useAccount();
  const { hasAccount } = useCheckAccount();
  const accessToken = useGlobalState((state) => state.accessToken);
  return isConnected && hasAccount && !isAccessTokenExpired(accessToken);
};
