"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { CubePicker } from "@/lib/types/api"

type CubeComboboxProps = {
  cubes: CubePicker[]
  value: string | null
  onValueChange: (cubeId: string | null) => void
  placeholder?: string
  disabled?: boolean
  showBrand?: boolean
  id?: string
}

function cubeLabel(cube: CubePicker, showBrand: boolean) {
  return showBrand ? `${cube.name} · ${cube.brand}` : cube.name
}

export function CubeCombobox({
  cubes,
  value,
  onValueChange,
  placeholder = "Select a cube",
  disabled = false,
  showBrand = false,
  id,
}: CubeComboboxProps) {
  const selected =
    cubes.find((cube) => String(cube.id) === value) ?? null

  return (
    <Combobox
      items={cubes}
      value={selected}
      onValueChange={(cube) =>
        onValueChange(cube ? String(cube.id) : null)
      }
      itemToStringLabel={(cube) => cubeLabel(cube, showBrand)}
      isItemEqualToValue={(a, b) => String(a.id) === String(b.id)}
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
          {(cube) => (
            <ComboboxItem key={cube.id} value={cube}>
              {cubeLabel(cube, showBrand)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
