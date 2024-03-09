import clsx from "clsx";
import React from "react";

type ButtonSize = "small" | "large";
type ButtonVariant = "primary" | "secondary" | "tertiary";

type ButtonProps = {
  text: string;
  isLoading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const variants: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  tertiary: "btn-accent",
};

const sizes: Record<ButtonSize, string> = {
  small: "text-[14px] min-w-[80px] h-[32px] min-h-[32px] px-[24px] py-[6px]",
  large: "text-[16px] min-w-[140px] h-[45px] min-h-[45px] px-[32px] py-[6px]",
};

const Button = React.forwardRef<HTMLButtonElement | null, ButtonProps>((props, ref) => {
  const { text, type, size = "large", variant = "primary", isLoading, ...restProps } = props;

  return (
    <button {...restProps} type={type || "button"} className={clsx("btn", variants[variant], sizes[size])} ref={ref}>
      {text} {isLoading && <span className="loading loading-spinner"></span>}
    </button>
  );
});

export default Button;
