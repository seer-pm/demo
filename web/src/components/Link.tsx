import React from "react";

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export const Link: React.FC<LinkProps> = ({ children, to, ...props }: LinkProps) => {
  return (
    <a {...props} href={to}>
      {children}
    </a>
  );
};
