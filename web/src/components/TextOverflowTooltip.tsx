import clsx from "clsx";

function TextOverflowTooltip({
  text,
  maxChar,
  className,
}: {
  text: string;
  maxChar: number;
  url?: string;
  className?: string;
}) {
  if (text.length <= maxChar) {
    return <p>{text}</p>;
  }
  return (
    <div className="tooltip">
      <p className="tooltiptext !w-[100%] !whitespace-pre-wrap">{text}</p>
      <p className={clsx("whitespace-nowrap", className)}>{text.slice(0, maxChar - 3)}...</p>
    </div>
  );
}

export default TextOverflowTooltip;
