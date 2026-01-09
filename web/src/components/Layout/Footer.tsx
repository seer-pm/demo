import { useTheme } from "@/hooks/useTheme";
import { DiscordIcon, GithubIcon, MoonIcon, SecuredByKleros, SunIcon, TelegramIcon, TwitterIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";

export default function Footer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-purple-dark flex flex-col lg:flex-row justify-between min-h-[64px] items-center max-lg:py-[24px] max-lg:space-y-[24px] px-[24px] text-white mt-auto">
      <div>
        <a href="https://kleros.io/" target="_blank" rel="noopener noreferrer">
          <SecuredByKleros />
        </a>
      </div>
      <div className="flex items-center space-x-[16px] text-white">
        {/*<a href={paths.etherscan()} target="_blank" rel="noopener noreferrer">
          <EtherscanIcon />
        </a>*/}
        {/*<a href={paths.snapshot()} target="_blank" rel="noopener noreferrer">
          <SnapshotIcon />
        </a>*/}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-[32px] h-[32px] rounded hover:bg-white/10 transition-colors"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <MoonIcon fill="white" width="20" height="20" />
          ) : (
            <SunIcon fill="white" width="20" height="20" />
          )}
        </button>
        <a href={paths.discord()} target="_blank" rel="noopener noreferrer">
          <DiscordIcon />
        </a>
        <a href={paths.telegram()} target="_blank" rel="noopener noreferrer">
          <TelegramIcon />
        </a>
        <a href={paths.twitter()} target="_blank" rel="noopener noreferrer">
          <TwitterIcon />
        </a>
        <a href={paths.github()} target="_blank" rel="noopener noreferrer">
          <GithubIcon />
        </a>
      </div>
    </div>
  );
}
