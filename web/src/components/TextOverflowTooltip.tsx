import clsx from "clsx";

function TextOverflowTooltip({
  text,
  maxChar,
  className,
  isUseTitle,
}: {
  text: string;
  maxChar: number;
  url?: string;
  className?: string;
  isUseTitle?: boolean;
}) {
  if (text.length <= maxChar) {
    return <p>{text}</p>;
  }
  return (
    <>
      {isUseTitle ? (
        <p className={clsx("whitespace-nowrap", className)} title={text}>
          {text.slice(0, maxChar - 3)}...
        </p>
      ) : (
        <>
          <div className="tooltip">
            <p className="tooltiptext !w-[100%] !whitespace-pre-wrap break-words">{text}</p>
            <p className={clsx("whitespace-nowrap", className)}>{text.slice(0, maxChar - 3)}...</p>
          </div>
        </>
      )}
    </>
  );
}

export default TextOverflowTooltip;
