import Button from "@/components/Form/Button";
import useCheckAccount from "@/hooks/useCheckAccount";
import { useLocalStorageKey } from "@/hooks/useLocalStorageKey";
import { Market } from "@/hooks/useMarket";
import { Discussion } from "@orbisclub/components";
import "@orbisclub/components/dist/index.modern.css";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useEffect, useState } from "react";

function Comments({ market }: { market: Market }) {
  const ceramicSession = useLocalStorageKey("ceramic-session", () => {});
  const [isLoading, setLoading] = useState(false);
  const { hasAccount, isLoading: isLoadingAccount } = useCheckAccount();

  useEffect(() => {
    if (ceramicSession && !isLoadingAccount && !hasAccount) {
      const orbis = new Orbis();
      orbis.logout({});
    }
  }, [ceramicSession, isLoadingAccount, hasAccount]);
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
      <Discussion key={ceramicSession} context={`${import.meta.env.VITE_ORBIS_CONTEXT}:${market.id.toLowerCase()}`} />
    </>
  );
}

export default Comments;
