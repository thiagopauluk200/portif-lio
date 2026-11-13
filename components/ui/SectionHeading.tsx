import { Reveal } from "./Reveal";
import { Emphasis } from "./Emphasis";

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="mb-12 flex flex-col gap-4 md:mb-16 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {index} — {eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight text-balance sm:text-5xl">
          <Emphasis text={title} />
        </h2>
      </div>
      {description && <p className="max-w-sm text-muted md:text-right">{description}</p>}
    </Reveal>
  );
}
