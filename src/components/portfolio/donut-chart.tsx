import type { AllocationSlice } from "@/lib/portfolio/types";

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ slices }: { slices: AllocationSlice[] }) {
  function segmentLength(percentage: number) {
    return Math.max(
      (percentage / 100) * CIRCUMFERENCE,
      CIRCUMFERENCE * 0.02,
    );
  }

  return (
    <svg
      viewBox="0 0 160 160"
      className="mx-auto size-40 -rotate-90"
      role="img"
      aria-label="Diagram alokasi aset"
    >
      <circle
        cx="80"
        cy="80"
        r={RADIUS}
        fill="none"
        stroke="var(--surface-muted)"
        strokeWidth="28"
      />
      {slices.map((slice, index) => {
        const length = segmentLength(slice.percentage);
        const offset = slices
          .slice(0, index)
          .reduce(
            (total, previous) =>
              total + segmentLength(previous.percentage),
            0,
          );

        return (
          <circle
            key={slice.key}
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke={slice.color}
            strokeWidth="28"
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={-offset}
          />
        );
      })}
    </svg>
  );
}
