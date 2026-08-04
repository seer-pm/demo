import type { ReactNode } from "react";

export function ReplyIcon({ type }: { type: "line" | "full" }) {
  if (type === "full") {
    return (
      <svg
        width="15"
        height="12"
        viewBox="0 0 17 13"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: "0.25rem" }}
        aria-hidden="true"
      >
        <path
          d="M6.40127 10.375L0.691272 6.27502C0.556779 6.19554 0.445325 6.08238 0.3679 5.94669C0.290476 5.81101 0.249756 5.65749 0.249756 5.50127C0.249756 5.34505 0.290476 5.19152 0.3679 5.05584C0.445325 4.92015 0.556779 4.80699 0.691272 4.72752L6.40127 0.625016C6.53739 0.544955 6.69226 0.502334 6.85017 0.501478C7.00808 0.500622 7.16341 0.541561 7.30039 0.620141C7.43736 0.69872 7.55111 0.812142 7.63008 0.948893C7.70905 1.08564 7.75043 1.24085 7.75002 1.39877V3.00002C9.62502 3.00002 15.25 3.00002 16.5 13C13.375 7.37502 7.75002 8.00002 7.75002 8.00002V9.60127C7.75002 10.3013 6.99252 10.7238 6.40127 10.3763V10.375Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="11"
      viewBox="0 0 17 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: "0.25rem" }}
      aria-hidden="true"
    >
      <path
        d="M6.40127 10.375L0.691272 6.27502C0.556779 6.19554 0.445325 6.08238 0.3679 5.94669C0.290476 5.81101 0.249756 5.65749 0.249756 5.50127C0.249756 5.34505 0.290476 5.19152 0.3679 5.05584C0.445325 4.92015 0.556779 4.80699 0.691272 4.72752L6.40127 0.625016C6.53739 0.544955 6.69226 0.502334 6.85017 0.501478C7.00808 0.500622 7.16341 0.541561 7.30039 0.620141C7.43736 0.69872 7.55111 0.812142 7.63008 0.948893C7.70905 1.08564 7.75043 1.24085 7.75002 1.39877V3.00002C9.62502 3.00002 15.25 3.00002 16.5 13C13.375 7.37502 7.75002 8.00002 7.75002 8.00002V9.60127C7.75002 10.3013 6.99252 10.7238 6.40127 10.3763V10.375Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LikeIcon({ type }: { type: "line" | "full" }) {
  if (type === "full") {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 15"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: "0.25rem" }}
        aria-hidden="true"
      >
        <path d="M7.65298 13.9149L7.6476 13.9121L7.62912 13.9024C7.61341 13.8941 7.59102 13.8822 7.56238 13.8667C7.50511 13.8358 7.42281 13.7907 7.31906 13.732C7.11164 13.6146 6.81794 13.4425 6.46663 13.2206C5.76556 12.7777 4.82731 12.1314 3.88539 11.3197C2.04447 9.73318 0 7.35227 0 4.5C0 2.01472 2.01472 0 4.5 0C5.9144 0 7.17542 0.652377 8 1.67158C8.82458 0.652377 10.0856 0 11.5 0C13.9853 0 16 2.01472 16 4.5C16 7.35227 13.9555 9.73318 12.1146 11.3197C11.1727 12.1314 10.2344 12.7777 9.53337 13.2206C9.18206 13.4425 8.88836 13.6146 8.68094 13.732C8.57719 13.7907 8.49489 13.8358 8.43762 13.8667C8.40898 13.8822 8.38659 13.8941 8.37088 13.9024L8.3524 13.9121L8.34702 13.9149L8.34531 13.9158C8.13 14.03 7.87 14.03 7.65529 13.9161L7.65298 13.9149Z" />
      </svg>
    );
  }
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: "0.25rem" }}
      aria-hidden="true"
    >
      <path
        d="M13.875 4.84375C13.875 3.08334 12.3884 1.65625 10.5547 1.65625C9.18362 1.65625 8.00666 2.45403 7.5 3.59242C6.99334 2.45403 5.81638 1.65625 4.44531 1.65625C2.61155 1.65625 1.125 3.08334 1.125 4.84375C1.125 9.95831 7.5 13.3438 7.5 13.3438C7.5 13.3438 13.875 9.95831 13.875 4.84375Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuHorizontal() {
  return (
    <svg width="14" height="3" viewBox="0 0 14 3" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.75 1.5C0.75 0.809644 1.30964 0.25 2 0.25C2.69036 0.25 3.25 0.809644 3.25 1.5C3.25 2.19036 2.69036 2.75 2 2.75C1.30964 2.75 0.75 2.19036 0.75 1.5ZM5.75 1.5C5.75 0.809644 6.30964 0.25 7 0.25C7.69036 0.25 8.25 0.809644 8.25 1.5C8.25 2.19036 7.69036 2.75 7 2.75C6.30964 2.75 5.75 2.19036 5.75 1.5ZM10.75 1.5C10.75 0.809644 11.30964 0.25 12 0.25C12.6904 0.25 13.25 0.809644 13.25 1.5C13.25 2.19036 12.6904 2.75 12 2.75C11.3096 2.75 10.75 2.19036 10.75 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EmptyStateComments() {
  return (
    <svg
      width="280"
      viewBox="0 0 522 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: "38%", height: "auto" }}
      aria-hidden="true"
      focusable="false"
    >
      <g filter="url(#sdEmptyFilter0)">
        <rect x="18.5" y="7" width="427" height="124" rx="24" fill="var(--sd-bg-tertiary)" />
        <circle cx="80.4999" cy="68.9999" r="17.7778" fill="var(--sd-border-secondary)" />
        <circle cx="80.5" cy="69" r="26.6667" stroke="var(--sd-color-active)" strokeWidth="6.66667" />
        <rect x="124.5" y="42" width="289" height="18" rx="9" fill="var(--sd-border-secondary)" />
        <rect x="124.5" y="78" width="183" height="18" rx="9" fill="var(--sd-border-secondary)" />
        <rect x="19" y="7.5" width="426" height="123" rx="23.5" stroke="var(--sd-border-secondary)" />
      </g>
      <g filter="url(#sdEmptyFilter1)">
        <rect x="76.5" y="107" width="427" height="124" rx="24" fill="var(--sd-bg-tertiary)" />
        <circle cx="138.5" cy="169" r="17.7778" fill="var(--sd-border-secondary)" />
        <circle cx="138.5" cy="169" r="26.6667" stroke="var(--sd-color-active)" strokeWidth="6.66667" />
        <rect x="182.5" y="142" width="289" height="18" rx="9" fill="var(--sd-border-secondary)" />
        <rect x="182.5" y="178" width="183" height="18" rx="9" fill="var(--sd-border-secondary)" />
        <rect x="77" y="107.5" width="426" height="123" rx="23.5" stroke="var(--sd-border-secondary)" />
      </g>
      <defs>
        <filter
          id="sdEmptyFilter0"
          x="0.5"
          y="0"
          width="463"
          height="160"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow" />
          <feOffset dy="11" />
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0509804 0 0 0 0 0.117647 0 0 0 0 0.2 0 0 0 0.04 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="14" operator="erode" in="SourceAlpha" result="effect2_dropShadow" />
          <feOffset dy="14" />
          <feGaussianBlur stdDeviation="6" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0509804 0 0 0 0 0.117647 0 0 0 0 0.2 0 0 0 0.08 0" />
          <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
        </filter>
        <filter
          id="sdEmptyFilter1"
          x="58.5"
          y="100"
          width="463"
          height="160"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow" />
          <feOffset dy="11" />
          <feGaussianBlur stdDeviation="10" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0509804 0 0 0 0 0.117647 0 0 0 0 0.2 0 0 0 0.04 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="14" operator="erode" in="SourceAlpha" result="effect2_dropShadow" />
          <feOffset dy="14" />
          <feGaussianBlur stdDeviation="6" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0509804 0 0 0 0 0.117647 0 0 0 0 0.2 0 0 0 0.08 0" />
          <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

export type { ReactNode };
