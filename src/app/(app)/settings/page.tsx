import type { Metadata } from "next";
import { AppearancePreview } from "@/components/settings/appearance-preview";
import { PageIntro } from "@/components/ui/page-intro";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Preferensi"
        title="Settings"
        description="Atur tampilan dan, di fase berikutnya, preferensi akun serta privasi UangKu."
      />
      <AppearancePreview />
    </>
  );
}
