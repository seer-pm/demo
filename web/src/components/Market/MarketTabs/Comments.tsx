import ErrorBoundary from "@/components/ErrorBoundary";
import Button from "@/components/Form/Button";
import { useIsAccountConnected } from "@/hooks/useIsConnectedAndSignedIn";
import { useLocalStorageKey } from "@/hooks/useLocalStorageKey";
import { Market } from "@/hooks/useMarket";
import SEER_ENV from "@/lib/env";
import { Discussion } from "@orbisclub/components";
import "@orbisclub/components/dist/index.modern.css";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useEffect, useState } from "react";

function Comments({ market }: { market: Market }) {
  const ceramicSession = useLocalStorageKey("ceramic-session", () => {});
  const [isLoading, setLoading] = useState(false);
  const isConnected = useIsAccountConnected();

  useEffect(() => {
    if (ceramicSession && !isConnected) {
      const orbis = new Orbis();
      orbis.logout({});
    }
  }, [ceramicSession, isConnected]);
  useEffect(() => {
    const orbisContainer = document.querySelector("._MBDTd");
    if (!orbisContainer) return;
    const loginContainer = orbisContainer.children[0] as HTMLDivElement;
    if (!loginContainer) return;
    loginContainer.style.display = ceramicSession ? "block" : "none";
  }, [ceramicSession]);

  const signOrbis = async () => {
    const orbis = new Orbis();
    if (!localStorage.getItem("ceramic-session")) {
      setLoading(true);
      await orbis.connect_v2({});
      setLoading(false);
    }
  };
  return (
    <>
      {!ceramicSession && (
        <Button
          isLoading={isLoading}
          className="w-[250px] mb-4"
          type="button"
          text="Leave a comment"
          onClick={() => signOrbis()}
        />
      )}
      <ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <Discussion key={ceramicSession} context={`${SEER_ENV.VITE_ORBIS_CONTEXT}:${market.id.toLowerCase()}`} />
      </ErrorBoundary>
    </>
  );
}

export default Comments;
