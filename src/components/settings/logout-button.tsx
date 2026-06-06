import { logout } from "@/app/(app)/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button className="mt-4 flex min-h-13 w-full items-center justify-center rounded-control border border-expense/30 bg-surface px-5 font-bold text-expense transition-colors hover:bg-expense/10">
        Keluar
      </button>
    </form>
  );
}
