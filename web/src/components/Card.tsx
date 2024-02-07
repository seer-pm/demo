import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export function Card({ children, title }: CardProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {title && <div className="card-title">{title}</div>}

        {children}
      </div>
    </div>
  );
}
