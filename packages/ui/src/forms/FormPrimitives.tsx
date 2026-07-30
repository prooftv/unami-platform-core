import React from "react";

import { Separator } from "../primitives/Separator";

type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      <div>
        <h3 className="text-base font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <Separator />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

type FieldGroupProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function FieldGroup({ label, description, error, required, children, className }: FieldGroupProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden>*</span>}
      </label>
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

type SubmitBarProps = {
  children: React.ReactNode;
  className?: string;
};

export function SubmitBar({ children, className }: SubmitBarProps) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-6 border-t ${className ?? ""}`}>
      {children}
    </div>
  );
}

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
};

export function FilterSelect({ value, onChange, options, placeholder = 'All', className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ''}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

type FormActionsProps = {
  children: React.ReactNode;
  align?: "left" | "right" | "between";
  className?: string;
};

export function FormActions({ children, align = "right", className }: FormActionsProps) {
  const alignClass = align === "left" ? "justify-start" : align === "between" ? "justify-between" : "justify-end";
  return (
    <div className={`flex items-center gap-3 ${alignClass} ${className ?? ""}`}>
      {children}
    </div>
  );
}
