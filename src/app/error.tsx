"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Client-side boundary - can't reach the pino instance (a server-only
    // logger bundled with a worker-thread transport), so this follows
    // Next.js's own recommended pattern of reporting via console.error.
    // Server-originated errors (actions, API routes) are logged server-side
    // via src/lib/logger.ts before they ever reach this boundary.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Что-то пошло не так</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Произошла непредвиденная ошибка. Попробуй ещё раз — если не поможет, обнови страницу.
          </p>
          <Button type="button" onClick={reset}>
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
