"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { buildRecordProgression } from "@/lib/workout-trend-calc";
import type { PersonalRecordItem } from "@/components/workouts/PersonalRecordsList";

const RECORD_TYPE_LABELS: Record<string, string> = {
  max_weight: "Макс. вес",
  max_reps: "Макс. повторений",
  max_volume: "Макс. объём",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

function formatDateLabel(dateLabel: string): string {
  const [year, month, day] = dateLabel.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

interface Combo {
  exerciseName: string;
  recordType: string;
}

function comboKey(combo: Combo): string {
  return `${combo.exerciseName}::${combo.recordType}`;
}

export function PersonalRecordChart({ records }: { records: PersonalRecordItem[] }) {
  const [selectedKey, setSelectedKey] = useState("");

  const combos: Combo[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    const combo = { exerciseName: record.exerciseName, recordType: record.recordType };
    const key = comboKey(combo);
    if (!seen.has(key)) {
      seen.add(key);
      combos.push(combo);
    }
  }

  if (combos.length === 0) return null;

  const activeKey = combos.some((c) => comboKey(c) === selectedKey) ? selectedKey : comboKey(combos[0]);
  const selected = combos.find((c) => comboKey(c) === activeKey)!;
  const points = buildRecordProgression(
    records.map((r) => ({ ...r, achievedAt: new Date(r.achievedAt) })),
    selected.exerciseName,
    selected.recordType,
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Прогрессия рекорда</CardTitle>
        <Select value={activeKey} onValueChange={setSelectedKey}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {combos.map((combo) => (
              <SelectItem key={comboKey(combo)} value={comboKey(combo)}>
                {combo.exerciseName} · {RECORD_TYPE_LABELS[combo.recordType] ?? combo.recordType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {points.length < 2 ? (
          <p className="text-sm text-muted-foreground">Нужно минимум 2 рекорда, чтобы построить график</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                labelFormatter={(label) => formatDateLabel(String(label))}
                formatter={(value) => [Number(value), "Значение"]}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
