"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "ocean") {
      window.localStorage.setItem("theme", "classic");
      const root = window.document.documentElement;
      root.classList.remove("ocean");
      root.classList.add("classic");
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="classic"
      enableSystem={false}
      themes={["classic", "dark", "green", "sunset"]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
