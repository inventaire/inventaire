import { characters } from '#lib/find_ordinal'

export function findNextLastOrdinal (lexicographicOrdinal) {
  if (!lexicographicOrdinal) return '0'
  const ordinalPrefix = lexicographicOrdinal.slice(0, -1)
  const ordinalLastChar = lexicographicOrdinal.slice(-1)
  const ordinalIndex = characters.indexOf(ordinalLastChar)
  const nextOrdinalSuffix = characters[ordinalIndex + 1]
  return ordinalPrefix.concat(nextOrdinalSuffix)
}
