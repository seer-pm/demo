import clsx from "clsx";

const svg = `data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='3' ry='3' stroke='%239747FF' stroke-width='2' stroke-dasharray='15%2c 10' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e`;

export function DashedBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx("bg-purple-medium dark:bg-base-200 rounded-[3px]", className)}
      style={{ backgroundImage: `url("${svg}")` }}
    >
      {children}
    </div>
  );
}
