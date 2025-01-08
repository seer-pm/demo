import { useGlobalState } from "@/hooks/useGlobalState";
import { fetchAuth, isTwoStringsEqual } from "@/lib/utils";
import { useEffect } from "react";
import { useAccount } from "wagmi";

export function AuthUpdater() {
  const { accessToken, setAccessToken } = useGlobalState();
  const { address } = useAccount();

  useEffect(() => {
    if (!address || !accessToken) {
      return;
    }

    (async () => {
      const data = await fetchAuth(accessToken, "/.netlify/functions/me", "GET");

      if (!isTwoStringsEqual(data.user.id, address)) {
        // clear the access token when the account changes
        setAccessToken("");
      }
    })();
  }, [address]);

  return <></>;
}
