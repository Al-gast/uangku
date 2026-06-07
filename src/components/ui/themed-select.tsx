"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type ThemedSelectOption = {
  value: string;
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

type ThemedSelectProps = {
  label?: ReactNode;
  value: string;
  options: ThemedSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: ReactNode;
  helperText?: ReactNode;
  name?: string;
  onChange: (value: string) => void;
};

function findEnabledIndex(
  options: ThemedSelectOption[],
  startIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) {
    return -1;
  }

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index =
      (startIndex + direction * offset + options.length) % options.length;

    if (!options[index]?.disabled) {
      return index;
    }
  }

  return -1;
}

export function ThemedSelect({
  label,
  value,
  options,
  placeholder = "Pilih opsi",
  disabled = false,
  required = false,
  error,
  helperText,
  name,
  onChange,
}: ThemedSelectProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : findEnabledIndex(options, -1, 1),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-option-index="${activeIndex}"]`,
        )
        ?.focus();
    });
  }, [activeIndex, open]);

  function openSelect() {
    const nextIndex =
      selectedIndex >= 0 && !options[selectedIndex]?.disabled
        ? selectedIndex
        : findEnabledIndex(options, -1, 1);
    setActiveIndex(nextIndex);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function selectOption(option: ThemedSelectOption) {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    close();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openSelect();
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "Tab") {
      close();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];

      if (option) {
        selectOption(option);
      }
      return;
    }

    let nextIndex = activeIndex;

    if (event.key === "ArrowDown") {
      nextIndex = findEnabledIndex(options, activeIndex, 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = findEnabledIndex(options, activeIndex, -1);
    } else if (event.key === "Home") {
      nextIndex = options.findIndex((option) => !option.disabled);
    } else if (event.key === "End") {
      nextIndex = options.findLastIndex((option) => !option.disabled);
    } else {
      return;
    }

    event.preventDefault();

    if (nextIndex >= 0) {
      setActiveIndex(nextIndex);
      panelRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-option-index="${nextIndex}"]`,
        )
        ?.focus();
    }
  }

  return (
    <div>
      {name && !disabled && <input type="hidden" name={name} value={value} />}

      {label && (
        <span
          id={`${id}-label`}
          className="mb-2 block text-sm font-bold"
        >
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-invalid={Boolean(error)}
        aria-required={required}
        onClick={openSelect}
        onKeyDown={handleTriggerKeyDown}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-control border bg-surface px-4 text-left outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted ${
          error
            ? "border-expense focus:border-expense focus:ring-expense/10"
            : "border-border focus:border-accent focus:ring-accent-soft"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span
            className={`flex items-center gap-2 truncate text-sm font-semibold ${
              selectedOption ? "text-foreground" : "text-muted"
            }`}
          >
            {selectedOption?.icon && (
              <span className="shrink-0" aria-hidden="true">
                {selectedOption.icon}
              </span>
            )}
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
          </span>
          {selectedOption?.description && (
            <span className="mt-0.5 block truncate text-xs text-muted">
              {selectedOption.description}
            </span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-sm text-muted transition ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {(error || helperText) && (
        <p
          className={`mt-2 text-xs leading-5 ${
            error ? "text-expense" : "text-muted"
          }`}
        >
          {error ?? helperText}
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/25"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <div
            ref={panelRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={label ? `${id}-label` : undefined}
            onKeyDown={handleListKeyDown}
            className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] mx-auto max-h-[min(24rem,calc(100dvh-8rem))] max-w-md overflow-y-auto rounded-card border border-border bg-surface p-2 text-foreground shadow-card sm:bottom-6"
          >
            {options.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">
                Belum ada pilihan.
              </p>
            ) : (
              options.map((option, index) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={option.disabled}
                    tabIndex={index === activeIndex ? 0 : -1}
                    data-option-index={index}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => selectOption(option)}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left outline-none transition focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-45 ${
                      selected
                        ? "bg-accent-soft text-accent-strong"
                        : "hover:bg-surface-muted"
                    }`}
                  >
                    {option.icon && (
                      <span className="shrink-0 text-lg" aria-hidden="true">
                        {option.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="mt-0.5 block text-xs leading-5 text-muted">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="shrink-0 font-bold"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
