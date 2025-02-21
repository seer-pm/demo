import { useEffect, useState } from "react";

function useCheckAccount() {
  const [hasAccount, sethasAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const checkAccount = async () => {
      setIsLoading(true);
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        sethasAccount(accounts.length > 0);
      }
      setIsLoading(false);
    };

    checkAccount();
    window.ethereum?.on("accountsChanged", checkAccount);

    return () => {
      window.ethereum?.removeListener("accountsChanged", checkAccount);
    };
  }, []);
  return { hasAccount, isLoading };
}

export default useCheckAccount;
