'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  BarChart as ReBarChart,
  AreaChart as ReAreaChart,
  PieChart as RePieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// ── Shared types ──────────────────────────────────────────────────────────────

export type ChartDataPoint = Record<string, string | number>;

export type ChartSeries = {
  key: string;
  label?: string;
  color?: string;
};

type BaseChartProps = {
  data?: ChartDataPoint[];
  series?: ChartSeries[];
  xKey?: string;
  height?: number;
  className?: string;
  emptyMessage?: string;
};

// ── Palette — maps to CSS variables so presets work automatically ─────────────

const PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 220 70% 50%))',
  'hsl(var(--chart-3, 160 60% 45%))',
  'hsl(var(--chart-4, 30 80% 55%))',
  'hsl(var(--chart-5, 280 65% 60%))',
];

function color(series: ChartSeries[], index: number): string {
  return series[index]?.color ?? PALETTE[index % PALETTE.length];
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyChart({ height, message }: { height: number; message: string }) {
  return (
    <div
      style={{ height }}
      className="w-full flex items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/20"
    >
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Shared tooltip style ──────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  color: 'hsl(var(--card-foreground))',
  fontSize: 12,
};

// ── ChartContainer ────────────────────────────────────────────────────────────

export function ChartContainer({
  children,
  height = 300,
  className,
}: {
  children: React.ReactNode;
  height?: number;
  className?: string;
}) {
  return (
    <div style={{ height }} className={`w-full ${className ?? ''}`}>
      {children}
    </div>
  );
}

// ── LineChart ─────────────────────────────────────────────────────────────────

export function LineChart({
  data,
  series = [{ key: 'value' }],
  xKey = 'label',
  height = 300,
  emptyMessage = 'No data yet',
}: BaseChartProps) {
  if (!data || data.length === 0) return <EmptyChart height={height} message={emptyMessage} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={color(series, i)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}

// ── BarChart ──────────────────────────────────────────────────────────────────

export function BarChart({
  data,
  series = [{ key: 'value' }],
  xKey = 'label',
  height = 300,
  emptyMessage = 'No data yet',
}: BaseChartProps) {
  if (!data || data.length === 0) return <EmptyChart height={height} message={emptyMessage} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={color(series, i)} radius={[2, 2, 0, 0]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}

// ── AreaChart ─────────────────────────────────────────────────────────────────

export function AreaChart({
  data,
  series = [{ key: 'value' }],
  xKey = 'label',
  height = 300,
  emptyMessage = 'No data yet',
}: BaseChartProps) {
  if (!data || data.length === 0) return <EmptyChart height={height} message={emptyMessage} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color(series, i)} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color(series, i)} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={color(series, i)}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
          />
        ))}
      </ReAreaChart>
    </ResponsiveContainer>
  );
}

// ── PieChart ──────────────────────────────────────────────────────────────────

export type PieDataPoint = { label: string; value: number; color?: string };

export function PieChart({
  data,
  height = 300,
  emptyMessage = 'No data yet',
}: {
  data?: PieDataPoint[];
  height?: number;
  emptyMessage?: string;
}) {
  if (!data || data.length === 0) return <EmptyChart height={height} message={emptyMessage} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius="70%"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={entry.color ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RePieChart>
    </ResponsiveContainer>
  );
}
