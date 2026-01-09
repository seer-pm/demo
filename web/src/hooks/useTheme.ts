import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const updateDocumentTheme = (theme: Theme) => {
  if (typeof document !== "undefined") {
    document.body.setAttribute("data-theme", theme);
  }
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme: Theme) => {
        set({ theme });
        updateDocumentTheme(theme);
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          updateDocumentTheme(newTheme);
          return { theme: newTheme };
        });
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Set theme on initial load after rehydration
        if (state && typeof document !== "undefined") {
          updateDocumentTheme(state.theme);
        }
      },
    },
  ),
);

// Initialize theme on module load (for SSR compatibility)
if (typeof document !== "undefined") {
  const stored = localStorage.getItem("theme-storage");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme) {
        updateDocumentTheme(parsed.state.theme);
      }
    } catch {
      // Ignore parse errors
    }
  }
}
