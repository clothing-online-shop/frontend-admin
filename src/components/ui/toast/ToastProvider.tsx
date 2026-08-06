import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToastContext, type ToastContextValue } from "./ToastContext";
import { CheckCircleIcon, ErrorHexaIcon, CloseIcon } from "@/icons";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const AUTO_DISMISS_MS = 3500;
const LEAVE_DURATION_MS = 200;

let nextToastId = 0;

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const close = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), LEAVE_DURATION_MS);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    const autoDismiss = setTimeout(close, AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(autoDismiss);
    };
  }, [close]);

  const isSuccess = toast.variant === "success";
  const Icon = isSuccess ? CheckCircleIcon : ErrorHexaIcon;
  const shown = isVisible && !isLeaving;

  return (
    <div
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border bg-white shadow-theme-lg transition-all duration-200 ease-standard dark:bg-gray-900 ${
        isSuccess
          ? "border-success-200 dark:border-success-500/30"
          : "border-error-200 dark:border-error-500/30"
      } ${shown ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}
    >
      <div className="flex items-start gap-3 p-4 pr-9">
        <Icon className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm font-medium text-gray-700 dark:text-white/90">{toast.message}</p>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Đóng thông báo"
        className="absolute right-3 top-3 text-gray-400 transition-colors duration-200 ease-standard hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <CloseIcon className="size-4" />
      </button>

      <div className="h-1 w-full bg-gray-100 dark:bg-white/5">
        <div
          className={`h-full ${isSuccess ? "bg-success-500" : "bg-error-500"} ${
            isVisible ? "transition-[width] ease-linear" : ""
          }`}
          style={{
            width: isVisible ? "0%" : "100%",
            transitionDuration: isVisible ? `${AUTO_DISMISS_MS}ms` : "0ms",
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, variant, message }]);
  }, []);

  const value: ToastContextValue = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed top-4 right-4 z-99999 flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={remove} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
