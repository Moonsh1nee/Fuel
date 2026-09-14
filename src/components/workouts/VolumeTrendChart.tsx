"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { listWorkoutLogsRange } from "@/lib/actions/workouts";
import { buildWeeklyVolumeTrend, type WeeklyVolumePoint } from "@/lib/workout-trend-calc";

const WEEKS = 12;
const weekFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function formatWeekLabel(weekLabel: string): string {
  const [year, month, day] = weekLabel.split("-").map(Number);
  return weekFormatter.format(new Date(year, month - 1, day));
}

export function VolumeTrendChart() {
  const [points, setPoints] = useState<WeeklyVolumePoint[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - WEEKS * 7);

    startTransition(async () => {
      const logs = await listWorkoutLogsRange(start, end);
      setPoints(buildWeeklyVolumeTrend(logs, start, WEEKS));
    });
  }, []);

  const hasData = points.some((p) => p.sessionCount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Объём тренировок за {WEEKS} недель</CardTitle>
      </CardHeader>
      <CardContent>
        {!isPending && !hasData ? (
          <p className="text-sm text-muted-foreground">Пока нет тренировок за этот период</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                tickFormatter={formatWeekLabel}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                labelFormatter={(label) => formatWeekLabel(String(label))}
                formatter={(value) => [`${Math.round(Number(value))} кг`, "Объём"]}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="totalVolume" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
