"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ConfirmOptions = { title?: string; message: string; confirmText?: string; cancelText?: string };
type AlertOptions = { title?: string; message: string };

type DialogContextType = {
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
  alert: (opts: AlertOptions | string) => Promise<void>;
  toast: (message: string) => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog debe usarse dentro de <DialogProvider>");
  return ctx;
}

export default function DialogProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const [alertState, setAlertState] = useState<{ opts: AlertOptions; resolve: () => void } | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const toastId = useRef(0);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts: normalized, resolve });
    });
  }, []);

  const alertFn = useCallback((opts: AlertOptions | string) => {
    const normalized = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<void>((resolve) => {
      setAlertState({ opts: normalized, resolve });
    });
  }, []);

  const toast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, alert: alertFn, toast }}>
      {children}

      {confirmState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            {confirmState.opts.title && (
              <h3 className="font-bold text-lg mb-1 text-fermento-dark">{confirmState.opts.title}</h3>
            )}
            <p className="text-sm text-black/70 mb-5 whitespace-pre-line">{confirmState.opts.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  confirmState.resolve(false);
                  setConfirmState(null);
                }}
                className="px-4 py-2 rounded-lg text-sm hover:bg-black/5"
              >
                {confirmState.opts.cancelText ?? "Cancelar"}
              </button>
              <button
                onClick={() => {
                  confirmState.resolve(true);
                  setConfirmState(null);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-fermento-red text-white hover:opacity-90"
                autoFocus
              >
                {confirmState.opts.confirmText ?? "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {alertState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            {alertState.opts.title && (
              <h3 className="font-bold text-lg mb-1 text-fermento-dark">{alertState.opts.title}</h3>
            )}
            <p className="text-sm text-black/70 mb-5 whitespace-pre-line">{alertState.opts.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  alertState.resolve();
                  setAlertState(null);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-fermento-red text-white hover:opacity-90"
                autoFocus
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-fermento-dark text-white text-sm px-4 py-2.5 rounded-full shadow-lg max-w-full text-center"
          >
            {t.message}
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}
