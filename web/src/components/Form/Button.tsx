import { Link, LinkProps } from "@/components/Link";
import clsx from "clsx";
import React from "react";

type ButtonSize = "small" | "large";
type ButtonVariant = "primary" | "secondary" | "tertiary";

type BaseProps = {
  text: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  tertiary: "btn-accent",
};

const sizes: Record<ButtonSize, string> = {
  small: "text-[14px] min-w-[80px] h-[32px] min-h-[32px] px-[24px] py-[6px]",
  large: "text-[16px] min-w-[140px] h-[45px] min-h-[45px] px-[32px] py-[6px]",
};

const Button = React.forwardRef<HTMLButtonElement, BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => {
    const { text, type, size = "large", variant = "primary", icon, isLoading, className, ...restProps } = props;

    if (isLoading) {
      restProps["disabled"] = true;
    }

    return (
      <button
        {...restProps}
        type={type || "button"}
        className={clsx("btn @container", variants[variant], sizes[size], className)}
        ref={ref}
      >
        {isLoading && <span className="loading loading-spinner"></span>}
        {icon || ""}
        <span className={isLoading ? "@[190px]:inline hidden" : ""}>{text}</span>
      </button>
    );
  },
);

const LinkButton = (props: BaseProps & LinkProps) => {
  const { text, size = "large", variant = "primary", icon, isLoading, className = "", ...restProps } = props;

  return (
    <Link {...restProps} className={clsx("btn", variants[variant], sizes[size], className)}>
      {isLoading && <span className="loading loading-spinner"></span>}
      {icon || ""}
      {text}
    </Link>
  );
};

export default Button;

export { LinkButton };
