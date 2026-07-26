type SectionTitleProps = {
  title: string;
  description?: string;
  className?: string;
};

export function SectionTitle({ title, description, className }: SectionTitleProps) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
