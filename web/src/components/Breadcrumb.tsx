import { Link } from "@/components/Link";
import { HomeIcon } from "@/lib/icons";
import React from "react";

interface BreadcrumbProps {
  links: { title: string; url?: string }[];
}

export default function Breadcrumb({ links }: BreadcrumbProps) {
  return (
    <div className="flex items-center space-x-2 text-purple-primary text-[14px]">
      <Link to="/">
        <HomeIcon />
      </Link>
      {links.map((link) => {
        return (
          <React.Fragment key={link.title}>
            <div>/</div>
            {link.url ? (
              <Link to={link.url} className="font-semibold">
                {link.title}
              </Link>
            ) : (
              <div className="font-semibold">{link.title}</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
