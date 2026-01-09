import ErrorBoundary from "@/components/ErrorBoundary";
import Button from "@/components/Form/Button";
import { useIsAccountConnected } from "@/hooks/useIsConnectedAndSignedIn";
import { useLocalStorageKey } from "@/hooks/useLocalStorageKey";
import { useTheme } from "@/hooks/useTheme";
import SEER_ENV from "@/lib/env";
import { Market } from "@/lib/market";
import { Discussion, defaultTheme } from "@orbisclub/components";
import "@orbisclub/components/dist/index.modern.css";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useEffect, useState } from "react";

// Create a copy of defaultTheme for darkTheme, with deep copies of objects we'll modify
const darkTheme = {
  ...defaultTheme,
  bg: { ...defaultTheme.bg },
  border: { ...defaultTheme.border },
};
// Configure darkTheme
darkTheme.bg.main = "oklch(var(--b1)/var(--tw-bg-opacity, 1))";
darkTheme.border.main = "var(--separator-100)";
darkTheme.border.secondary = "var(--separator-100)";

function Comments({ market }: { market: Market }) {
  const ceramicSession = useLocalStorageKey("ceramic-session", () => {});
  const [isLoading, setLoading] = useState(false);
  const isConnected = useIsAccountConnected();
  const { theme } = useTheme();

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
        <Discussion
          theme={theme === "dark" ? darkTheme : defaultTheme}
          key={ceramicSession}
          context={`${SEER_ENV.VITE_ORBIS_CONTEXT}:${market.id.toLowerCase()}`}
        />
      </ErrorBoundary>
    </>
  );
}

export default Comments;
