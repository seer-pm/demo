import { CheckCircleIcon, CloseCircleOutlineIcon, ExclamationCircleIcon, InfoCircleIcon } from "@/lib/icons";
import clsx from "clsx";
import React from "react";

const CLASSES = {
  info: "alert-info",
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
};

type ALERT_TYPES = keyof typeof CLASSES;

const ICONS: Record<ALERT_TYPES, React.ReactNode> = {
  info: <InfoCircleIcon width="24" height="24" />,
  success: <CheckCircleIcon width="24" height="24" />,
  error: <CloseCircleOutlineIcon width="24" height="24" />,
  warning: <ExclamationCircleIcon width="24" height="24" />,
};

interface AlertProps {
  children: React.ReactNode;
  type: ALERT_TYPES;
  title?: string;
  className?: string;
}

export function Alert({ type, title, children, className = "" }: AlertProps) {
  return (
    <div className={clsx("alert", CLASSES[type], className)}>
      {ICONS[type]}
      <div>
        {title && <div className="text-[16px] font-semibold alert-title">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
