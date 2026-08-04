import { Card, CardContent } from "@/components/ui/card";

const RECORD_TYPE_LABELS: Record<string, string> = {
  max_weight: "Макс. вес",
  max_reps: "Макс. повторений",
  max_volume: "Макс. объём",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export interface PersonalRecordItem {
  id: string;
  exerciseName: string;
  recordType: string;
  value: number;
  unit: string;
  achievedAt: Date | string;
}

export function PersonalRecordsList({ records }: { records: PersonalRecordItem[] }) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Рекордов пока нет
        </CardContent>
      </Card>
    );
  }

  const grouped = new Map<string, PersonalRecordItem[]>();
  for (const record of records) {
    const list = grouped.get(record.exerciseName) ?? [];
    list.push(record);
    grouped.set(record.exerciseName, list);
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from(grouped.entries()).map(([exerciseName, exerciseRecords]) => (
        <Card key={exerciseName}>
          <CardContent className="flex flex-col gap-2 py-3">
            <span className="font-medium">{exerciseName}</span>
            <div className="flex flex-col gap-1">
              {exerciseRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {RECORD_TYPE_LABELS[record.recordType] ?? record.recordType}
                  </span>
                  <span>
                    {record.value} {record.unit}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(record.achievedAt))}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
