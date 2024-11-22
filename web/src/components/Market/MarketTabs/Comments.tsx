import { useLocalStorageKey } from "@/hooks/useLocalStorageKey";
import { Market } from "@/hooks/useMarket";
import { Discussion } from "@orbisclub/components";
import "@orbisclub/components/dist/index.modern.css";
import { config } from "@/wagmi";
import { disconnect } from "@wagmi/core";
import { useEffect } from "react";
import { useAccount } from "wagmi";

function Comments({ market }: { market: Market }) {
  const { isConnected } = useAccount();
  useEffect(() => {
    const orbisContainer = document.querySelector("._MBDTd");
    if (!orbisContainer) return;
    const loginContainer = orbisContainer.children[0] as HTMLDivElement;
    console.log(loginContainer);
    if (!loginContainer) return;
    loginContainer.style.display = isConnected ? "block" : "none";
  }, [isConnected]);
  const ceramicSession = useLocalStorageKey("ceramic-session", (value) => {
    if (!value && isConnected) {
      disconnect(config);
    }
  });
  return (
    <Discussion key={ceramicSession} context={`${import.meta.env.VITE_ORBIS_CONTEXT}:${market.id.toLowerCase()}`} />
  );
}

export default Comments;
