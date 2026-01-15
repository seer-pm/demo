import { useTheme } from "@/hooks/useTheme";
import { MoonIcon, SunIcon } from "@/lib/icons";

interface ThemeToggleButtonProps {
  iconFill: string;
  iconSize?: string;
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggleButton({
  iconFill,
  iconSize = "20",
  showLabel = false,
  className = "",
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className || "flex items-center gap-2 hover:font-semibold"}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <MoonIcon fill={iconFill} width={iconSize} height={iconSize} />
      ) : (
        <SunIcon fill={iconFill} width={iconSize} height={iconSize} />
      )}
      {showLabel && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
    </button>
  );
}
