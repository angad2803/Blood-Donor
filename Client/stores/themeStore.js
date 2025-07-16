import { create } from "zustand";
import { persist } from "zustand/middleware";

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false,

      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;

        // Add transition class to prevent GSAP conflicts
        document.body.classList.add("theme-transitioning");

        set({ isDarkMode: newMode });

        // Update document class for Tailwind dark mode
        if (newMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }

        // Remove transition class after theme transition
        setTimeout(() => {
          document.body.classList.remove("theme-transitioning");
        }, 300);
      },

      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });

        // Update document class for Tailwind dark mode
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      initializeTheme: () => {
        const { isDarkMode } = get();

        // Check system preference if no stored preference
        if (isDarkMode === null || isDarkMode === undefined) {
          const systemDarkMode = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          set({ isDarkMode: systemDarkMode });

          if (systemDarkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        } else {
          // Apply stored preference
          if (isDarkMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      },
    }),
    {
      name: "blood-donor-theme",
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);

export default useThemeStore;
