import { isAccessTokenExpired } from "@/lib/utils";
import { useAccount } from "wagmi";
import useCheckAccount from "./useCheckAccount";
import { useGlobalState } from "./useGlobalState";

export const useIsAccountConnected = () => {
  const { isConnected } = useAccount();
  const { hasAccount } = useCheckAccount();

  return isConnected && hasAccount;
};

export const useIsConnectedAndSignedIn = () => {
  const isAccountConnected = useIsAccountConnected();
  const accessToken = useGlobalState((state) => state.accessToken);

  return isAccountConnected && !isAccessTokenExpired(accessToken);
};
