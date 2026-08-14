import React, { useEffect, useRef, useState } from "react";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  size?: number;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className = "", size = 24 }) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setFailed(false);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setFailed(true);
      timeoutRef.current = setTimeout(() => setFailed(false), 2000);
    }
  };

  const status = failed ? "Couldn't copy" : copied ? "Copied" : "Copy to clipboard";

  return (
    <>
      <button
        onClick={handleCopy}
        className={`
        inline-flex items-center justify-center
        p-2 rounded-lg
        transition-colors duration-200
        hover:bg-gray-100
        ${className}
      `}
        title={status}
        aria-label={status}
        type="button"
      >
        {copied ? (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied || failed ? status : ""}
      </span>
    </>
  );
};
