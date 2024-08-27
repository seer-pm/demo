import { HomeIcon } from "@/lib/icons";
import React from "react";
import { Link } from "react-router-dom";

interface BreadcrumbProps {
  links: { title: string; url?: string }[];
}

export default function Breadcrumb({ links }: BreadcrumbProps) {
  return (
    <div className="flex items-center space-x-2 text-[#9747FF] text-[14px]">
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
