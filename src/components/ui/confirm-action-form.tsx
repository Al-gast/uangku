"use client";

import { useId, useRef } from "react";

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
}: ConfirmActionFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
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

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-card border border-border bg-surface p-0 text-foreground shadow-card backdrop:bg-black/45"
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
              className="min-h-11 rounded-control bg-expense px-4 text-sm font-bold text-white transition active:scale-[0.98]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
