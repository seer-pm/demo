export type ThemeToggleProps = {
  /** The theme in effect now, whether the reader chose it or it follows the system. */
  theme: "light" | "dark";
  onToggle: () => void;
  className?: string;
};

/**
 * Light and dark switch for a site header. The icon shows the theme a click switches to, and the
 * label says so. Where the choice is stored, and how the page applies it before first paint, stays
 * with each site. Needs components.css.
 */
export function ThemeToggle({ theme, onToggle, className = "" }: ThemeToggleProps) {
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;

  return (
    <button
      type="button"
      className={`seer-button seer-button-ghost seer-button-icon${className ? ` ${className}` : ""}`}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <span className={`seer-icon seer-icon-${next === "dark" ? "moon" : "sun"}`} aria-hidden="true" />
    </button>
  );
}
