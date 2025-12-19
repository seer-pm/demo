import { LinkButton } from "@/components/Form/Button";
import { paths } from "@/lib/paths";

function ErrorPage() {
  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] text-center">
      <div className="text-[24px] font-semibold">
        The future's a mystery right now... something went wrong! <br />
        Refresh or come back later!
      </div>
      <div>
        If the error persist, let us know on{" "}
        <a href={paths.discord()} className="text-purple-primary hover:underline">
          Discord
        </a>
      </div>
      <div>
        <LinkButton text="Go to home" to="/" variant="primary" />
      </div>
    </div>
  );
}

export default ErrorPage;
