"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";
type ToastData = { id: number; message: string; variant: ToastVariant };
type ToastContextValue = { toast: (message: string, variant?: ToastVariant) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-primary/30 bg-primary/10 text-primary",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") return <CheckCircle2 className="h-5 w-5 shrink-0" />;
  if (variant === "error") return <AlertCircle className="h-5 w-5 shrink-0" />;
  return <Info className="h-5 w-5 shrink-0" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);
  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), message, variant }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((item) => window.setTimeout(() => dismiss(item.id), 4500));
    return () => timers.forEach(window.clearTimeout);
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((item) => (
          <div key={item.id} role="status" className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur ${variantStyles[item.variant]}`}>
            <ToastIcon variant={item.variant} />
            <p className="min-w-0 flex-1 break-words">{item.message}</p>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="Tutup notifikasi" className="-mr-1 -mt-1 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}