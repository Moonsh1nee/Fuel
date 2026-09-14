import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMacroSummary } from "@/lib/macro-summary-calc";
import { buildDailyMacroTrend } from "@/lib/nutrition-trend-calc";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { NutritionTrendChart } from "@/components/dashboard/NutritionTrendChart";

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

  const trendDays = 14;
  const trendStart = new Date(start);
  trendStart.setDate(trendStart.getDate() - (trendDays - 1));

  const [foodLogsToday, workoutToday, recentRecords, activePlan, foodLogsTrend] = await Promise.all([
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
    prisma.nutritionPlan.findFirst({ where: { userId, isActive: true } }),
    prisma.foodLog.findMany({ where: { userId, date: { gte: trendStart, lt: end } } }),
  ]);

  const macroSummary = computeMacroSummary(foodLogsToday);
  const trendPoints = buildDailyMacroTrend(foodLogsTrend, trendStart, trendDays);

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

      {activePlan && (
        <Card>
          <CardHeader>
            <CardTitle>Прогресс к цели «{activePlan.name}»</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ProgressRow label="Калории" value={macroSummary.totalCalories} target={activePlan.targetCalories} unit="ккал" />
            <ProgressRow label="Белки" value={macroSummary.totalProtein} target={activePlan.targetProtein} unit="г" />
            <ProgressRow label="Углеводы" value={macroSummary.totalCarbs} target={activePlan.targetCarbs} unit="г" />
            <ProgressRow label="Жиры" value={macroSummary.totalFat} target={activePlan.targetFat} unit="г" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Калории за {trendDays} дней</CardTitle>
        </CardHeader>
        <CardContent>
          <NutritionTrendChart points={trendPoints} targetCalories={activePlan?.targetCalories ?? null} />
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

function ProgressRow({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
}) {
  if (target === null || target <= 0) return null;
  const percent = Math.min(100, Math.max(0, (value / target) * 100));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <Progress value={percent} />
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
