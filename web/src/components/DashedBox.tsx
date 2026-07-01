import clsx from "clsx";

export function DashedBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "bg-purple-medium dark:bg-base-200 bg-opacity-0 dark:bg-opacity-0 rounded-[3px] border border-purple-primary",
        className,
      )}
    >
      {children}
    </div>
  );
}
