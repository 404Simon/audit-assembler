"use client"

import * as React from "react"

import { ExamplesButton } from "@/components/audit/examples-button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "cn"
import type { ExampleField } from "@/lib/examples/data"

export function FormField({
  id,
  label,
  hint,
  error,
  exampleField,
  optional,
  className,
  children,
}: {
  id?: string
  label: string
  hint?: React.ReactNode
  error?: string
  exampleField?: ExampleField
  optional?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>
          {label}
          {optional ? (
            <span className="text-xs font-normal text-muted-foreground">
              optional
            </span>
          ) : null}
        </FieldLabel>
        {exampleField ? <ExamplesButton field={exampleField} /> : null}
      </div>
      {children}
      {error ? (
        <FieldDescription className="text-destructive">
          {error}
        </FieldDescription>
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </Field>
  )
}

export interface Option<T extends string> {
  value: T
  label: string
}

export function SelectField<T extends string>({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  ariaInvalid,
  ariaLabel,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly Option<T>[]
  placeholder?: string
  className?: string
  ariaInvalid?: boolean
  ariaLabel?: string
}) {
  const hasValue = options.some((option) => option.value === value)
  return (
    <Select
      items={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      value={value || null}
      onValueChange={(next) => onValueChange(next ?? "")}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder ?? "Select…"} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {!hasValue && value ? (
            <SelectItem value={value}>{value}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function SegmentedField<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ariaLabel,
}: {
  value: T
  onValueChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string; activeClassName?: string }>
  className?: string
  ariaLabel?: string
}) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next) => {
        const chosen = next[0]
        if (chosen) onValueChange(chosen as T)
      }}
      spacing={0}
      className={className}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "border border-input first:rounded-r-none last:rounded-l-none [&:not(:first-child)]:-ml-px",
            option.activeClassName ??
              "aria-pressed:bg-muted aria-pressed:text-foreground"
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
