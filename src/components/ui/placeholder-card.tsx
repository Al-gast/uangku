import { Icon, type IconName } from "@/components/ui/icons";

type PlaceholderCardProps = {
  icon: IconName;
  title: string;
  description: string;
  label?: string;
};

export function PlaceholderCard({
  icon,
  title,
  description,
  label = "Segera hadir",
}: PlaceholderCardProps) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="mb-8 flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
          <Icon name={icon} className="size-6" />
        </span>
        <span className="rounded-full bg-surface-muted px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </section>
  );
}
