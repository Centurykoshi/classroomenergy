"use client";

import { MonitorCog } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/Components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

const themeOptions = [
  { id: "classic", label: "Classic" },
  { id: "dark", label: "Graphite" },
  { id: "green", label: "Green" },
  { id: "sunset", label: "Sunset" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const activeTheme = themeOptions.find((option) => option.id === theme)?.label ?? "Theme";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MonitorCog className="h-4 w-4" />
          {activeTheme}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => setTheme(option.id)}
            className="flex items-center justify-between"
          >
            <span>{option.label}</span>
            {theme === option.id ? <span className="text-xs text-primary">Active</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
