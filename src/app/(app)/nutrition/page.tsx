import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FoodLogSection } from "@/components/nutrition/FoodLogSection";
import { NutritionPlansSection } from "@/components/nutrition/NutritionPlansSection";

export default function NutritionPage() {
  return (
    <Tabs defaultValue="log">
      <TabsList>
        <TabsTrigger value="log">Лог</TabsTrigger>
        <TabsTrigger value="plans">Планы</TabsTrigger>
      </TabsList>
      <TabsContent value="log">
        <FoodLogSection />
      </TabsContent>
      <TabsContent value="plans">
        <NutritionPlansSection />
      </TabsContent>
    </Tabs>
  );
}
