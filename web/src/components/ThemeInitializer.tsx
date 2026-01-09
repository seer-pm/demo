import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";

/**
 * Component that initializes the theme on mount.
 * This ensures the theme is applied immediately when the page loads.
 * The CSS in index.scss handles the gradient background based on data-theme attribute.
 */
export function ThemeInitializer() {
  const { theme } = useTheme();

  useEffect(() => {
    // Ensure the theme is applied to the body
    // The CSS will automatically apply the correct gradient based on [data-theme="dark"]
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return null;
}
