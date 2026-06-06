import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { skipOnboarding } from "@/app/onboarding/actions";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Brand } from "@/components/ui/brand";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Onboarding",
};

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { error: queryError } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  if (!authData?.claims) {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("user_settings")
    .select("onboarding_completed")
    .maybeSingle();

  if (settings?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[480px] px-6 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-4">
        <Brand />
        <form action={skipOnboarding}>
          <button className="rounded-full px-3 py-2 text-sm font-bold text-muted transition hover:bg-surface-muted hover:text-foreground">
            Lewati semua
          </button>
        </form>
      </div>

      {queryError && (
        <p className="mt-6 rounded-control border border-expense/30 bg-expense/10 p-4 text-sm leading-6 text-expense">
          {queryError}
        </p>
      )}

      <OnboardingForm />
    </main>
  );
}
