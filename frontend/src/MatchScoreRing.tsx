interface MatchScoreRingProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

/**
 * Renders the AI Match Score as a partial arc (the "trajectory" motif —
 * an ascending path rather than a closed circle) with the numeric score
 * in mono type at center.
 */
export default function MatchScoreRing({
  score,
  size = 96,
  label = "Match",
}: MatchScoreRingProps) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // arc sweeps 270 degrees (open at the bottom) to read as a "trajectory" not a full loop
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const offset = arcLength - (score / 100) * arcLength;

  const tone =
    score >= 85 ? "#34D399" : score >= 65 ? "#5B4FE8" : score >= 45 ? "#FBBF24" : "#FB7185";

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="data-figure text-xl font-semibold" style={{ color: tone }}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-dark-300 font-medium">
          {label}
        </span>
      </div>
    </div>
  );
}
