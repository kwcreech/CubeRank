"use client"

import { useEffect, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
}

type OptionComboboxProps = {
  options: ComboboxOption[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  emptyMessage?: string
  id?: string
}

export function OptionCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Search…",
  disabled = false,
  className,
  emptyMessage = "No results.",
  id,
}: OptionComboboxProps) {
  const selected = options.find((option) => option.value === value) ?? null
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(selected?.label ?? "")

  useEffect(() => {
    if (!open) {
      setInputValue(selected?.label ?? "")
    }
  }, [open, selected?.label, selected?.value])

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(option) => onValueChange(option?.value ?? null)}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setInputValue("")
      }}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        className={cn("w-full", className)}
        disabled={disabled}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function toComboboxOptions(values: string[]): ComboboxOption[] {
  return values.map((value) => ({ value, label: value }))
}
