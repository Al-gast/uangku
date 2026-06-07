import type { AllocationSlice } from "@/lib/portfolio/types";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2;

export function DonutChart({ slices }: { slices: AllocationSlice[] }) {
  function segmentLength(percentage: number) {
    return Math.max((percentage / 100) * CIRCUMFERENCE - GAP, 0);
  }

  return (
    <svg
      viewBox="0 0 160 160"
      className="mx-auto size-36 -rotate-90"
      role="img"
      aria-label="Diagram alokasi aset"
    >
      <circle
        cx="80"
        cy="80"
        r={RADIUS}
        fill="none"
        stroke="var(--surface-muted)"
        strokeWidth="22"
      />
      {slices.map((slice, index) => {
        const length = segmentLength(slice.percentage);
        const offset = slices
          .slice(0, index)
          .reduce(
            (total, previous) =>
              total + (previous.percentage / 100) * CIRCUMFERENCE,
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
            strokeWidth="22"
            strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
            strokeDashoffset={-offset}
          />
        );
      })}
    </svg>
  );
}
