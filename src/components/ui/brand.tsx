import { Icon } from "@/components/ui/icons";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-lg">
        <Icon name="sparkles" className="size-6" />
      </span>
      <div>
        <p className="text-lg font-extrabold tracking-[-0.04em] text-foreground">
          UangKu
        </p>
        <p className="text-xs text-muted">Teman finansial kamu</p>
      </div>
    </div>
  );
}
