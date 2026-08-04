import { Card, CardContent } from "@/components/ui/card";
import type { MacroSummary } from "@/lib/macro-summary-calc";

const METRICS: { key: keyof MacroSummary; label: string; unit: string }[] = [
  { key: "totalCalories", label: "Калории", unit: "ккал" },
  { key: "totalProtein", label: "Белки", unit: "г" },
  { key: "totalCarbs", label: "Углеводы", unit: "г" },
  { key: "totalFat", label: "Жиры", unit: "г" },
];

export function DailyMacroSummary({ summary }: { summary: MacroSummary }) {
  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.key} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span className="text-lg font-semibold tabular-nums">
                {Math.round(summary[metric.key])}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {metric.unit}
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
