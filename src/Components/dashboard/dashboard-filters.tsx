import { Button } from "@/Components/ui/button";
import { DashboardFilter } from "@/Components/dashboard/types";

interface DashboardFiltersProps {
  activeFilter: DashboardFilter;
  counts: Record<DashboardFilter, number>;
  onChange: (next: DashboardFilter) => void;
}

const filterLabels: Record<DashboardFilter, string> = {
  all: "All",
  on: "ON",
  off: "OFF",
  locked: "Locked",
};

export function DashboardFilters({ activeFilter, counts, onChange }: DashboardFiltersProps) {
  const options = Object.keys(filterLabels) as DashboardFilter[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <Button
            key={filter}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onChange(filter)}
            className="gap-2"
          >
            <span>{filterLabels[filter]}</span>
            <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-xs text-current dark:bg-white/10">
              {counts[filter]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
