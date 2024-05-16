import { newError } from '#lib/error/error'

// Characters sorted by charcater code (which is what JS and CouchDB views seem to use to compare strings)
const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const firstCharacter = characters[0]
const lastCharacter = characters.slice(-1)[0]
const middleCharacter = findMiddleCharacterBetween(firstCharacter, lastCharacter)

export function findOrdinalBetween (ordinalA, ordinalB) {
  if (ordinalA > ordinalB) [ ordinalA, ordinalB ] = [ ordinalB, ordinalA ]
  else if (ordinalA === ordinalB) throw newError('can not find an ordinal between equal ordinals', 500, { ordinalA, ordinalB })
  const longestLength = Math.max(ordinalA.length, ordinalB.length, 1)
  ordinalA = ordinalA.padEnd(longestLength, firstCharacter)
  ordinalB = ordinalB.padEnd(longestLength, lastCharacter)

  let ordinal = ''
  for (let index = 0; index < longestLength; index++) {
    const characterA = ordinalA[index]
    const characterB = ordinalB[index]
    if (characterA === characterB) {
      ordinal += characterA
    } else {
      const inBetweenCharacter = findMiddleCharacterBetween(characterA, characterB)
      ordinal += inBetweenCharacter
      // Only compare to the ordinalA, as the use of Math.trunc in findMiddleCharacterBetween should make `ordinal === ordinalB` impossible
      if (ordinal === ordinalA) {
        ordinal += middleCharacter
        return ordinal
      }
    }
    if (ordinal > ordinalA && ordinal < ordinalB) {
      return ordinal
    }
  }
  throw newError('finished without finding an ordinal', 500, { ordinalA, ordinalB, ordinal })
}

function findMiddleCharacterBetween (characterA?: string, characterB?: string) {
  const indexA = characterA ? characters.indexOf(characterA) : -1
  const indexB = characterB ? characters.indexOf(characterB) : characters.length
  const middleIndex = Math.trunc((indexA + indexB) / 2)
  return characters[middleIndex]
}
