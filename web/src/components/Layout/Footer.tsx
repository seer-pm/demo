import {
  DiscordIcon,
  EtherscanIcon,
  GithubIcon,
  SecuredByKleros,
  SnapshotIcon,
  TelegramIcon,
  TwitterIcon,
} from "@/lib/icons";

export default function Footer() {
  return (
    <div className="bg-blue-primary flex flex-col lg:flex-row justify-between min-h-[64px] items-center max-lg:py-[24px] max-lg:space-y-[24px] px-[24px] text-white">
      <div>
        <a href="https://kleros.io/" target="_blank" rel="noopener noreferrer">
          <SecuredByKleros />
        </a>
      </div>
      <div className="flex space-x-[16px]">
        <a href="#" target="_blank" rel="noopener noreferrer">
          <EtherscanIcon />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <GithubIcon />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <SnapshotIcon />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <DiscordIcon />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <TwitterIcon />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer">
          <TelegramIcon />
        </a>
      </div>
    </div>
  );
}
