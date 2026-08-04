import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WorkoutLogSection } from "@/components/workouts/WorkoutLogSection";
import { WorkoutPlansSection } from "@/components/workouts/WorkoutPlansSection";
import { PersonalRecordsSection } from "@/components/workouts/PersonalRecordsSection";
import { ExerciseLibraryBrowser } from "@/components/workouts/ExerciseLibraryBrowser";

export default function WorkoutsPage() {
  return (
    <Tabs defaultValue="log">
      <TabsList>
        <TabsTrigger value="log">Лог</TabsTrigger>
        <TabsTrigger value="plans">Планы</TabsTrigger>
        <TabsTrigger value="records">Рекорды</TabsTrigger>
        <TabsTrigger value="exercises">Упражнения</TabsTrigger>
      </TabsList>
      <TabsContent value="log">
        <WorkoutLogSection />
      </TabsContent>
      <TabsContent value="plans">
        <WorkoutPlansSection />
      </TabsContent>
      <TabsContent value="records">
        <PersonalRecordsSection />
      </TabsContent>
      <TabsContent value="exercises">
        <ExerciseLibraryBrowser />
      </TabsContent>
    </Tabs>
  );
}
