import { login, signup } from "@/app/login/actions";

export function AuthForm() {
  return (
    <form className="mt-8 space-y-4">
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
          className="min-h-13 w-full rounded-control border border-border bg-surface px-4 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </div>
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
          autoComplete="current-password"
          minLength={6}
          required
          placeholder="Minimal 6 karakter"
          className="min-h-13 w-full rounded-control border border-border bg-surface px-4 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </div>
      <button
        formAction={login}
        className="flex min-h-13 w-full items-center justify-center rounded-control bg-accent px-5 font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
      >
        Masuk
      </button>
      <button
        formAction={signup}
        className="flex min-h-13 w-full items-center justify-center rounded-control border border-border bg-surface px-5 font-bold text-foreground transition-colors hover:bg-surface-muted"
      >
        Buat akun
      </button>
    </form>
  );
}
