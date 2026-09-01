"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import {
  OptionCombobox,
  type ComboboxOption,
} from "@/components/ui/option-combobox"
import {
  cubeFamilyKey,
  defaultCubeInFamily,
  familySearchLabel,
  familyVisibleLabel,
  groupCubesByFamily,
  type CubeFamily,
} from "@/lib/cubes/family"
import type { CubePicker } from "@/lib/types/api"

type CubeFamilyPickerProps = {
  cubes: CubePicker[]
  value: string | null
  onValueChange: (cubeId: string | null) => void
  excludeId?: string | null
  placeholder?: string
  versionPlaceholder?: string
  disabled?: boolean
  showBrand?: boolean
  id?: string
}

export function CubeFamilyPicker({
  cubes,
  value,
  onValueChange,
  excludeId = null,
  placeholder = "Select a cube",
  versionPlaceholder = "Select a version",
  disabled = false,
  showBrand = false,
  id,
}: CubeFamilyPickerProps) {
  const families = useMemo(
    () => groupCubesByFamily(cubes, excludeId),
    [cubes, excludeId]
  )
  const selectedCube = cubes.find((cube) => String(cube.id) === value) ?? null
  const selectedFamily =
    selectedCube == null
      ? null
      : (families.find((family) => family.key === cubeFamilyKey(selectedCube)) ??
        null)
  const showVersionPicker = (selectedFamily?.totalVersions ?? 0) > 1
  const versionOptions = useMemo(
    () => toVersionOptions(selectedFamily),
    [selectedFamily]
  )

  const [open, setOpen] = useState(false)
  const selectedLabel = selectedFamily
    ? familyVisibleLabel(selectedFamily, showBrand)
    : ""
  const [inputValue, setInputValue] = useState(selectedLabel)

  useEffect(() => {
    if (!open) {
      setInputValue(selectedLabel)
    }
  }, [open, selectedLabel])

  return (
    <div className="space-y-3">
      <Combobox
        items={families}
        value={selectedFamily}
        onValueChange={(family) => {
          if (!family) {
            onValueChange(null)
            return
          }
          if (
            selectedCube &&
            family.cubes.some((cube) => cube.id === selectedCube.id)
          ) {
            return
          }
          onValueChange(String(defaultCubeInFamily(family).id))
        }}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) setInputValue("")
        }}
        itemToStringLabel={(family) => familyVisibleLabel(family, showBrand)}
        filter={(family, query) => {
          const needle = query.trim().toLowerCase()
          if (!needle) return true
          return familySearchLabel(family, showBrand)
            .toLowerCase()
            .includes(needle)
        }}
        isItemEqualToValue={(a, b) => a.key === b.key}
        disabled={disabled}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          className="w-full"
          disabled={disabled}
        />
        <ComboboxContent>
          <ComboboxEmpty>No cubes found.</ComboboxEmpty>
          <ComboboxList>
            {(family) => (
              <ComboboxItem key={family.key} value={family}>
                {familyVisibleLabel(family, showBrand)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {showVersionPicker && selectedFamily ? (
        <div className="space-y-2">
          <Label htmlFor={id ? `${id}-version` : undefined}>Version</Label>
          <OptionCombobox
            id={id ? `${id}-version` : undefined}
            options={versionOptions}
            value={value}
            onValueChange={onValueChange}
            placeholder={versionPlaceholder}
            disabled={disabled}
            emptyMessage="No versions found."
          />
        </div>
      ) : null}
    </div>
  )
}

function toVersionOptions(family: CubeFamily | null): ComboboxOption[] {
  if (!family) return []
  return family.cubes.map((cube) => ({
    value: String(cube.id),
    label: cube.versionLabel,
  }))
}
