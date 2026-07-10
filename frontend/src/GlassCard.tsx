import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  interactive?: boolean;
  arc?: boolean;
  className?: string;
}

/**
 * Core surface of the Trajectory AI theme. Every card, panel, and modal
 * should be built on this — never a plain bg-dark-900 div.
 */
export default function GlassCard({
  children,
  interactive = false,
  arc = false,
  className = "",
}: GlassCardProps) {
  return (
    <div
      className={[
        interactive ? "glass-panel-interactive" : "glass-panel",
        arc ? "arc-border-top" : "",
        "p-5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
