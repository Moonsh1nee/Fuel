"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NormalizedFood } from "@/lib/food-search";

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onResolved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: (food: NormalizedFood) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  async function resolveBarcode(code: string) {
    if (!code.trim()) return;
    setIsResolving(true);
    try {
      const res = await fetch(`/api/foods/barcode/${encodeURIComponent(code.trim())}`);
      if (res.status === 404) {
        toast.error("Продукт не найден");
        return;
      }
      if (!res.ok) {
        toast.error("Ошибка Open Food Facts");
        return;
      }
      const { result } = (await res.json()) as { result: NormalizedFood };
      onResolved(result);
      onOpenChange(false);
    } catch {
      toast.error("Не удалось найти продукт");
    } finally {
      setIsResolving(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current ?? undefined,
          (result) => {
            if (result) {
              controlsRef.current?.stop();
              controlsRef.current = null;
              void resolveBarcode(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        // Clears any error left over from a previous attempt in this same
        // open dialog (e.g. permission denied, retried, now granted).
        setCameraError(null);
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error ? err.message : "Камера недоступна — введите штрихкод вручную",
          );
        }
      }
    })();

    // Cleanup runs unconditionally on close/unmount, not only after a
    // successful scan - otherwise the camera stream keeps running in the
    // background after the dialog closes without a hit.
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
    // resolveBarcode intentionally excluded: it reads the latest onResolved/
    // onOpenChange via closure on each call, and listing it here would restart
    // the camera decode loop on every unrelated re-render (e.g. typing in the
    // manual-entry field below) - the opposite of what cleanup discipline needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сканировать штрихкод</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {cameraError ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              {cameraError}
            </div>
          ) : (
            <div className="relative h-48 overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-16 -translate-y-1/2 rounded-md border-2 border-primary/70" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Или введите штрихкод вручную</label>
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                placeholder="4600000000000"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void resolveBarcode(manualCode);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isResolving || !manualCode.trim()}
                onClick={() => void resolveBarcode(manualCode)}
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
