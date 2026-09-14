"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import type { DailyMacroPoint } from "@/lib/nutrition-trend-calc";

const dayFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function formatDateLabel(dateLabel: string): string {
  const [year, month, day] = dateLabel.split("-").map(Number);
  return dayFormatter.format(new Date(year, month - 1, day));
}

export function NutritionTrendChart({
  points,
  targetCalories,
}: {
  points: DailyMacroPoint[];
  targetCalories: number | null;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          labelFormatter={(label) => formatDateLabel(String(label))}
          formatter={(value) => [`${Math.round(Number(value))} ккал`, "Калории"]}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {targetCalories && (
          <ReferenceLine
            y={targetCalories}
            stroke="var(--color-chart-4)"
            strokeDasharray="4 4"
            label={{ value: "Цель", position: "insideTopRight", fontSize: 11, fill: "var(--color-chart-4)" }}
          />
        )}
        <Area
          type="monotone"
          dataKey="calories"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#calorieFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
