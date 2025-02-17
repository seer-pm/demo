import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import clsx from "clsx";
import { SVGAttributes } from "react";

function InvalidOutcomeImage({ width = 70, height = 83, className = "" }: SVGAttributes<SVGElement>) {
  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <svg width={width} height={height} viewBox="0 0 70 83" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M48.936 64.967a3.525 3.525 0 0 0 1.038 3.378l3.827 3.554 3.742 3.475v1.61H6.198V6.016h31.87v13.328c0 2.156 1.776 3.89 3.984 3.89h15.492v42.49L54.8 63.175a3.546 3.546 0 0 0-3.45-.792l-5.298-4.92a19.331 19.331 0 0 0 5.294-13.314c0-10.727-8.72-19.426-19.476-19.426-10.755 0-19.476 8.699-19.476 19.426 0 10.727 8.72 19.425 19.476 19.425 4.31 0 8.294-1.396 11.52-3.761.025.026.05.051.078.076l5.468 5.078Zm14.804 6.51V21.382a7.663 7.663 0 0 0-2.34-5.495L47.473 2.286A8.065 8.065 0 0 0 41.846 0H7.968C3.568 0 0 3.485 0 7.781V75.22C0 79.515 3.569 83 7.968 83h47.805a8.018 8.018 0 0 0 6.48-3.253l1.793 1.665a3.548 3.548 0 0 0 5.041-.218 3.525 3.525 0 0 0-.215-4.952l-5.132-4.765ZM42.495 18.984V4.882l14.402 14.102H42.494ZM31.87 60.279c-8.93 0-16.172-7.224-16.172-16.13 0-8.906 7.243-16.13 16.172-16.13 8.93 0 16.172 7.224 16.172 16.13 0 8.906-7.242 16.13-16.172 16.13Zm7.539-22.987a.348.348 0 0 0-.348-.347l-2.87.013-4.32 5.138-4.317-5.134-2.874-.013a.346.346 0 0 0-.265.573l5.656 6.72-5.656 6.717a.348.348 0 0 0 .265.572l2.873-.012 4.317-5.139 4.317 5.134 2.87.013a.346.346 0 0 0 .265-.572l-5.647-6.717 5.656-6.72a.347.347 0 0 0 .078-.226Z"
          fill="#999"
        />
      </svg>
    </div>
  );
}

const IMAGE_CLASS = "w-[48px] h-[48px] rounded-full mx-auto";
const SMALL_IMAGE_CLASS = "w-[30px] h-[30px] rounded-full mx-auto";

export function OutcomeImage({
  image,
  isInvalidOutcome,
  title,
}: {
  image: string | undefined;
  isInvalidOutcome: boolean;
  title: string;
}) {
  const isSmallScreen = useIsSmallScreen();
  const imageClass = isSmallScreen ? SMALL_IMAGE_CLASS : IMAGE_CLASS;
  if (isInvalidOutcome) {
    return <InvalidOutcomeImage width="20" height="24" className={clsx(imageClass, "bg-black-medium")} />;
  }

  if (image) {
    return <img src={image} alt={title} className={imageClass} />;
  }

  return <div className={clsx(imageClass, "bg-purple-primary")}></div>;
}
