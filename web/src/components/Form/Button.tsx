import React from "react";

type ButtonProps = {
  text: string;
  isLoading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement | null, ButtonProps>((props, ref) => {
  const { text, type, className, isLoading, ...restProps } = props;

  return (
    <button
      {...restProps}
      type={type || "button"}
      className={`btn input-bordered content-center ${className ?? ""}`}
      ref={ref}
    >
      {text} {isLoading && <span className="loading loading-spinner"></span>}
    </button>
  );
});

export default Button;
