"use client";

import { useId, useRef, useState } from "react";

type HiddenField = {
  name: string;
  value: string;
};

type ConfirmActionFormProps = {
  submitAction: (formData: FormData) => void | Promise<void>;
  fields: HiddenField[];
  buttonLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  buttonClassName?: string;
  confirmButtonClassName?: string;
};

export function ConfirmActionForm({
  submitAction,
  fields,
  buttonLabel,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  buttonClassName = "text-sm font-bold text-expense",
  confirmButtonClassName = "min-h-11 rounded-control bg-expense px-4 text-sm font-bold text-white transition active:scale-[0.98]",
}: ConfirmActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  function openDialog() {
    setIsOpen(true);
  }

  function closeDialog() {
    setIsOpen(false);
  }

  function confirmSubmit() {
    closeDialog();
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={submitAction}>
        {fields.map((field) => (
          <input
            key={field.name}
            type="hidden"
            name={field.name}
            value={field.value}
          />
        ))}
        <button type="button" onClick={openDialog} className={buttonClassName}>
          {buttonLabel}
        </button>
      </form>

      {isOpen && (
        <div className="fixed inset-0 z-[80] mx-auto flex max-w-[480px] items-center justify-center bg-black/45 p-4">
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={closeDialog}
            className="absolute inset-0"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-card border border-border bg-surface text-foreground shadow-card"
          >
            <div className="p-5">
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
                {description}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="min-h-11 rounded-control border border-border bg-surface text-sm font-bold text-muted transition active:scale-[0.98]"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={confirmSubmit}
                  className={confirmButtonClassName}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
