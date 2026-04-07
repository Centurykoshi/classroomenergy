import { History } from "lucide-react";

export function SetupInstructionsCard() {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
      <div className="rounded-lg border border-border/70 bg-background/70 p-4 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-4 w-4" />
          ESP8266 Setup
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">Polling URL</p>
        <code className="mt-2 block rounded-md bg-muted px-3 py-2 text-xs sm:text-sm">
          {origin}/api/esp8266/state
        </code>
      </div>

      <div className="rounded-lg border border-border/70 bg-background/55 p-4 text-sm text-muted-foreground backdrop-blur-sm">
        <ol className="space-y-2">
          <li>1. Poll this endpoint every 2-5 seconds.</li>
          <li>2. Parse response as [{"{name, pin, state, forceOff}"}].</li>
          <li>3. Use state values where 1 = ON and 0 = OFF.</li>
          <li>4. Connect each relay to the configured classroom pin.</li>
        </ol>
      </div>
    </section>
  );
}
