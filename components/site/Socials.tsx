import type { Profile } from "@/lib/schemas";
import { GithubIcon, LinkedinIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function Socials({ socials, className }: { socials: Profile["socials"]; className?: string }) {
  const links = [
    { href: socials.github, label: "GitHub", Icon: GithubIcon },
    { href: socials.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: socials.x, label: "X (Twitter)", Icon: XIcon },
  ].filter((l) => l.href);

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {links.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid size-11 place-items-center rounded-full border border-line text-muted transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
          >
            <Icon className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
