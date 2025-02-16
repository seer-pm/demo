import { useEffect, useState } from "react";

function useCheckAccount() {
  const [hasAccount, sethasAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const checkAccount = async () => {
      setIsLoading(true);
      if (window.ethereum) {
        // biome-ignore lint/suspicious/noExplicitAny:
        const accounts = await (window.ethereum as any)?.request({ method: "eth_accounts" });
        sethasAccount(accounts.length > 0);
      }
      setIsLoading(false);
    };

    checkAccount();
    // biome-ignore lint/suspicious/noExplicitAny:
    (window.ethereum as any)?.on("accountsChanged", checkAccount);

    return () => {
      // biome-ignore lint/suspicious/noExplicitAny:
      (window.ethereum as any)?.removeListener("accountsChanged", checkAccount);
    };
  }, []);
  return { hasAccount, isLoading };
}

export default useCheckAccount;
