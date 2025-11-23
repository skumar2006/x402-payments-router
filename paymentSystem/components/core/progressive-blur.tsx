import { cn } from "@/lib/utils";

interface ProgressiveBlurProps {
  className?: string;
  blurIntensity?: number;
}

export function ProgressiveBlur({ className, blurIntensity = 4 }: ProgressiveBlurProps) {
  return (
    <div
      className={cn("pointer-events-none absolute z-10", className)}
      style={{
        backdropFilter: `blur(${blurIntensity}px)`,
        maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
      }}
    />
  );
}

