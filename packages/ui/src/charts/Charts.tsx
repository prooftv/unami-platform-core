import React from "react";


type ChartContainerProps = {
  children: React.ReactNode;
  height?: number;
  className?: string;
};

export function ChartContainer({ children, height = 300, className }: ChartContainerProps) {
  return (
    <div style={{ height }} className={`w-full ${className ?? ""}`}>
      {children}
    </div>
  );
}

type ChartPlaceholderProps = {
  label: string;
  height?: number;
};

function ChartPlaceholder({ label, height = 300 }: ChartPlaceholderProps) {
  return (
    <div
      style={{ height }}
      className="w-full flex items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/20"
    >
      <p className="text-xs text-muted-foreground">{label} — connect a charting library</p>
    </div>
  );
}

export function LineChart({ height }: { height?: number }) {
  return <ChartPlaceholder label="LineChart" height={height} />;
}

export function BarChart({ height }: { height?: number }) {
  return <ChartPlaceholder label="BarChart" height={height} />;
}

export function AreaChart({ height }: { height?: number }) {
  return <ChartPlaceholder label="AreaChart" height={height} />;
}

export function PieChart({ height }: { height?: number }) {
  return <ChartPlaceholder label="PieChart" height={height} />;
}
