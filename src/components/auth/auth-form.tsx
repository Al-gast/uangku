"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { login, signup } from "@/app/login/actions";

const inputClassName =
  "min-h-13 w-full rounded-control border border-border bg-surface px-4 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition-colors hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Memproses..." : label}
    </button>
  );
}

function EmailField() {
  return (
    <div>
      <label
        htmlFor="email"
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="nama@email.com"
        className={inputClassName}
      />
    </div>
  );
}

function PasswordField({
  autoComplete,
}: {
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <div>
      <label
        htmlFor="password"
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete={autoComplete}
        minLength={6}
        required
        placeholder="Minimal 6 karakter"
        className={inputClassName}
      />
    </div>
  );
}

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  return (
    <form action={login} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <EmailField />
      <PasswordField autoComplete="current-password" />
      <SubmitButton label="Masuk" />
      <p className="pt-2 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-bold text-accent-strong">
          Buat akun
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  return (
    <form action={signup} className="mt-8 space-y-4">
      <EmailField />
      <PasswordField autoComplete="new-password" />
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-sm font-semibold text-foreground"
        >
          Konfirmasi password
        </label>
        <input
          id="confirm-password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          placeholder="Ulangi password"
          className={inputClassName}
        />
      </div>
      <SubmitButton label="Buat akun" />
      <p className="pt-2 text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-accent-strong">
          Masuk
        </Link>
      </p>
    </form>
  );
}
