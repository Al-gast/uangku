type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <header className="mb-7">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-bold tracking-[-0.035em] text-foreground">
        {title}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
        {description}
      </p>
    </header>
  );
}
