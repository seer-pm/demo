import type { ReactNode } from "react";

const URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?"')\]]/gi;

export function renderPlainTextWithLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_RE.source, URL_RE.flags);

  match = re.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const href = match[0];
    nodes.push(
      <a key={`${match.index}-${href}`} href={href} target="_blank" rel="noopener noreferrer">
        {href}
      </a>,
    );
    lastIndex = match.index + href.length;
    match = re.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function addressAccent(address?: string | null): { background: string; color: string } | undefined {
  if (!address) return undefined;
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    background: `hsl(${hue} 42% 88%)`,
    color: `hsl(${hue} 35% 38%)`,
  };
}
