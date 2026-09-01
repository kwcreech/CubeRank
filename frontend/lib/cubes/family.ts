import type { CubePicker } from "@/lib/types/api"

export type CubeFamily = {
  key: string
  baseName: string
  brand: string
  cubes: CubePicker[]
  totalVersions: number
  versionSearchText: string
}

export function cubeFamilyKey(cube: Pick<CubePicker, "baseName">) {
  return cube.baseName.trim().toLowerCase()
}

export function groupCubesByFamily(
  cubes: CubePicker[],
  excludeId?: string | null
): CubeFamily[] {
  const families = new Map<string, CubeFamily>()
  for (const cube of cubes) {
    const key = cubeFamilyKey(cube)
    const existing = families.get(key)
    if (existing) {
      existing.cubes.push(cube)
      continue
    }
    families.set(key, {
      key,
      baseName: cube.baseName,
      brand: cube.brand,
      cubes: [cube],
      totalVersions: 0,
      versionSearchText: "",
    })
  }
  const grouped: CubeFamily[] = []
  for (const family of families.values()) {
    family.cubes.sort(compareCubeVersions)
    const available = excludeId
      ? family.cubes.filter((cube) => String(cube.id) !== excludeId)
      : family.cubes
    if (available.length === 0) {
      continue
    }
    grouped.push({
      ...family,
      brand: pickFamilyBrand(family.cubes),
      cubes: available,
      totalVersions: family.cubes.length,
      versionSearchText: family.cubes.map((cube) => cube.versionLabel).join(" "),
    })
  }
  return grouped.sort((left, right) =>
    familyDisplayName(left).localeCompare(familyDisplayName(right), undefined, {
      sensitivity: "base",
    })
  )
}

export function familyDisplayName(family: CubeFamily) {
  if (family.totalVersions === 1) {
    return family.cubes[0].name
  }
  return family.baseName
}

export function familyVisibleLabel(family: CubeFamily, showBrand: boolean) {
  const name = familyDisplayName(family)
  return showBrand ? `${name} · ${family.brand}` : name
}

export function familySearchLabel(family: CubeFamily, showBrand: boolean) {
  return `${familyVisibleLabel(family, showBrand)} ${family.versionSearchText}`.trim()
}

export function defaultCubeInFamily(family: CubeFamily) {
  const preferred = family.cubes[0]
  if (!preferred) {
    throw new Error("Cube family has no versions")
  }
  return preferred
}

function pickFamilyBrand(cubes: CubePicker[]): string {
  const counts = new Map<string, number>()
  for (const cube of cubes) {
    const brand = cube.brand.trim()
    if (!brand) continue
    counts.set(brand, (counts.get(brand) ?? 0) + 1)
  }

  let maxCount = 0
  const brandsAtMax: string[] = []
  for (const [brand, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      brandsAtMax.length = 0
      brandsAtMax.push(brand)
    } else if (count === maxCount) {
      brandsAtMax.push(brand)
    }
  }
  if (brandsAtMax.length === 1) {
    return brandsAtMax[0]
  }

  const standard = cubes.find(
    (cube) => cube.versionLabel.toLowerCase() === "standard"
  )
  const standardBrand = standard?.brand.trim()
  if (standardBrand && (brandsAtMax.length === 0 || brandsAtMax.includes(standardBrand))) {
    return standardBrand
  }

  return cubes[0]?.brand.trim() ?? ""
}

function compareCubeVersions(left: CubePicker, right: CubePicker) {
  const leftStandard = left.versionLabel.toLowerCase() === "standard" ? 0 : 1
  const rightStandard = right.versionLabel.toLowerCase() === "standard" ? 0 : 1
  if (leftStandard !== rightStandard) {
    return leftStandard - rightStandard
  }
  const lengthDelta = left.versionLabel.length - right.versionLabel.length
  if (lengthDelta !== 0) {
    return lengthDelta
  }
  return left.versionLabel.localeCompare(right.versionLabel, undefined, {
    sensitivity: "base",
  })
}
