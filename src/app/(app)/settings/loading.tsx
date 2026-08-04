import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-52 w-full" />
    </div>
  );
}
