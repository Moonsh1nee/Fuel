import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMacroSummary } from "@/lib/macro-summary-calc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [foodLogsToday, workoutToday, recentRecords] = await Promise.all([
    prisma.foodLog.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    prisma.workoutLog.findFirst({
      where: { userId, date: { gte: start, lt: end } },
      include: { exerciseLogs: true },
    }),
    prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { achievedAt: "desc" },
      take: 5,
    }),
  ]);

  const macroSummary = computeMacroSummary(foodLogsToday);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Питание сегодня, {dateFormatter.format(new Date())}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Калории" value={macroSummary.totalCalories} unit="ккал" />
            <Metric label="Белки" value={macroSummary.totalProtein} unit="г" />
            <Metric label="Углеводы" value={macroSummary.totalCarbs} unit="г" />
            <Metric label="Жиры" value={macroSummary.totalFat} unit="г" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Тренировка сегодня</CardTitle>
        </CardHeader>
        <CardContent>
          {workoutToday ? (
            <div className="flex flex-col gap-1 text-sm">
              {workoutToday.durationMinutes && (
                <span className="text-muted-foreground">{workoutToday.durationMinutes} мин</span>
              )}
              {workoutToday.exerciseLogs.map((ex) => (
                <span key={ex.id}>
                  {ex.name}
                  {ex.sets && ex.repsPerSet ? ` — ${ex.sets}×${ex.repsPerSet}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Сегодня тренировок ещё не было</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние рекорды</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">Рекордов пока нет</p>
          ) : (
            <div className="flex flex-col gap-1.5 text-sm">
              {recentRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between">
                  <span>{record.exerciseName}</span>
                  <span className="text-muted-foreground">
                    {record.value} {record.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">
        {Math.round(value)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  );
}
