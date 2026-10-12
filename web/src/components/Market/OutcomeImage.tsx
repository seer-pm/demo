import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import clsx from "clsx";
import { SVGAttributes } from "react";

function InvalidOutcomeImage({ width = 70, height = 83, className = "" }: SVGAttributes<SVGElement>) {
  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <svg width={width} height={height} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3 20 6v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const IMAGE_CLASS = "w-[48px] h-[48px] rounded-full mx-auto dark:bg-neutral";
const SMALL_IMAGE_CLASS = "w-[30px] h-[30px] rounded-full mx-auto dark:bg-neutral";

export function OutcomeImage({
  image,
  isInvalidOutcome,
  title,
  className,
}: {
  image: string | undefined;
  isInvalidOutcome: boolean;
  title: string;
  className?: string;
}) {
  const isSmallScreen = useIsSmallScreen();
  const imageClass = className || (isSmallScreen ? SMALL_IMAGE_CLASS : IMAGE_CLASS);
  if (isInvalidOutcome) {
    return (
      <InvalidOutcomeImage
        width="20"
        height="24"
        className={clsx(imageClass, "bg-purple-primary/10 text-purple-primary")}
      />
    );
  }

  if (image) {
    return <img src={image} alt={title} className={imageClass} />;
  }

  return <div className={clsx(imageClass, "bg-purple-primary")}></div>;
}
