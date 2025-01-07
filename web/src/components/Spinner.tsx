import clsx from "clsx";

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={clsx("loading loading-spinner", className)}></span>;
}
