import { Link } from "@/components/Link";
import React from "react";

interface BreadcrumbProps {
  links: { title: string; url?: string }[];
}

export default function Breadcrumb({ links }: BreadcrumbProps) {
  return (
    <div className="flex items-center text-[13px] text-ink-4">
      <Link to="/" className="hover:text-ink-2 transition-colors">
        Markets
      </Link>
      {links.map((link) => {
        return (
          <React.Fragment key={link.title}>
            <span className="mx-[6px] text-ink-5">/</span>
            {link.url ? (
              <Link to={link.url} className="hover:text-ink-2 transition-colors">
                {link.title}
              </Link>
            ) : (
              <span className="text-ink-4">{link.title}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
