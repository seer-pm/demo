import { DiscordIcon, GithubIcon, SecuredByKleros, TwitterIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";

export default function Footer() {
  return (
    <div className="bg-purple-dark flex flex-col lg:flex-row justify-between min-h-[64px] items-center max-lg:py-[24px] max-lg:space-y-[24px] px-[24px] text-white mt-auto">
      <div>
        <a href="https://kleros.io/" target="_blank" rel="noopener noreferrer">
          <SecuredByKleros />
        </a>
      </div>
      <div className="flex space-x-[16px] text-white">
        {/*<a href={paths.etherscan()} target="_blank" rel="noopener noreferrer">
          <EtherscanIcon />
        </a>*/}
        {/*<a href={paths.snapshot()} target="_blank" rel="noopener noreferrer">
          <SnapshotIcon />
        </a>*/}
        <a href={paths.discord()} target="_blank" rel="noopener noreferrer">
          <DiscordIcon />
        </a>
        <a href={paths.twitter()} target="_blank" rel="noopener noreferrer">
          <TwitterIcon />
        </a>
        <a href={paths.github()} target="_blank" rel="noopener noreferrer">
          <GithubIcon />
        </a>
        {/* <a href={paths.telegram()} target="_blank" rel="noopener noreferrer">
          <TelegramIcon />
        </a>  */}
      </div>
    </div>
  );
}
