import ErrorBoundary from "@/components/ErrorBoundary";
import { useIsAccountConnected } from "@/hooks/useIsConnectedAndSignedIn";
import { useLocalStorageKey } from "@/hooks/useLocalStorageKey";
import { useTheme } from "@/hooks/useTheme";
import SEER_ENV from "@/lib/env";
import { Discussion, defaultTheme } from "@orbisclub/components";
import { Market } from "@seer-pm/sdk";
import "@orbisclub/components/dist/index.modern.css";
import { Orbis } from "@orbisclub/orbis-sdk";
import { useEffect, useState } from "react";

// Create a copy of defaultTheme for darkTheme, with deep copies of objects we'll modify
const darkTheme = {
  ...defaultTheme,
  bg: { ...defaultTheme.bg },
  border: { ...defaultTheme.border },
  color: { ...defaultTheme.color },
  badges: { ...defaultTheme.badges },
};
// Configure darkTheme
darkTheme.bg.main = "oklch(var(--b1)/var(--tw-bg-opacity, 1))";
darkTheme.border.main = "var(--separator-100)";
darkTheme.border.secondary = "var(--separator-100)";
darkTheme.color.main = "oklch(var(--bc))";
darkTheme.badges.main.bg = "var(--separator-100)";
darkTheme.badges.main.color = "oklch(var(--bc))";

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
        <button
          type="button"
          disabled={isLoading}
          onClick={() => signOrbis()}
          aria-label="Leave a comment"
          className="w-full mb-4 grid grid-cols-[1fr_auto] gap-[10px] items-center p-[8px] pl-[14px] bg-bg-2 rounded-[8px] text-left cursor-pointer hover:bg-bg-3 transition-colors disabled:opacity-70"
        >
          <span className="font-italic italic text-[15px] text-ink-5 truncate">
            {isLoading ? "Connecting…" : "Leave a comment…"}
          </span>
          <span className="px-[14px] py-[8px] bg-blue text-white rounded-full text-[13px] font-semibold">Connect</span>
        </button>
      )}
      <ErrorBoundary fallback={<p>Something went wrong.</p>}>
        <Discussion
          theme={theme === "dark" ? darkTheme : defaultTheme}
          key={ceramicSession}
          context={`${SEER_ENV.VITE_ORBIS_CONTEXT}:${market.id.toLowerCase()}`}
        />
      </ErrorBoundary>
      {/* The "Open Social with" row + duplicate social icons were removed —
          the footer already shows the social links. */}
    </>
  );
}

export default Comments;
