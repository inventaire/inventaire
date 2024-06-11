import { maxBy } from 'lodash-es'
import { characters, findOrdinalBetween } from '#lib/find_ordinal'
import type { ListingElement } from '#types/element'

export function findNewOrdinal (element, list, newOrdinal) {
  // Place element in last position if newOrdinal is too high
  if (list.length < newOrdinal) newOrdinal = list.length - 1
  if (list[newOrdinal]._id === element._id) return
  removeElementIfNecessary(element, list, newOrdinal)
  return findNewLexicographicOrdinal(newOrdinal, list)
}

function removeElementIfNecessary (element, list, newOrdinal) {
  // A make-it-fast implementation: find index from a subset of element,
  // as element must be removed only if its being moved up in the list
  // hence only if element is between first element and newOrdinal element
  const listSubset = list.slice(0, newOrdinal)
  const index = listSubset.findIndex(el => el._id === element._id)
  if (index !== -1) list.splice(index, 1)
}

function findNewLexicographicOrdinal (newOrdinal, currentElements) {
  let precedentElementIndex, beforeOrdinal
  if (newOrdinal === 0) {
    precedentElementIndex = 0
    // See nextHighestOrdinal comment on why '0' can be set as beforeOrdinal
    beforeOrdinal = '0'
  } else {
    precedentElementIndex = newOrdinal - 1
    beforeOrdinal = currentElements[precedentElementIndex].ordinal
  }
  const afterElement = currentElements[newOrdinal]
  let afterOrdinal
  if (!afterElement) {
    afterOrdinal = nextHighestOrdinal(currentElements)
  } else {
    afterOrdinal = afterElement.ordinal
  }
  const lexicographicOrdinal = findOrdinalBetween(beforeOrdinal, afterOrdinal)
  if (currentElements[precedentElementIndex].ordinal !== lexicographicOrdinal) {
    return lexicographicOrdinal
  }
}

export function nextHighestOrdinal (elements: ListingElement[]) {
  // First element's ordinal can not be the first lexicographical possibility (aka '0'),
  // since some ordinal slots should be available before first element,
  // to be able to replace first element when needed.
  // Taking the second lexicographical ordinal (as first ordinal ever assigned in a list),
  // should leave enough slots range (everything starting by '0').
  if (elements.length === 0) return '1'
  const highestOrdinalElement = maxBy(elements, 'ordinal')
  return findNextLastOrdinal(highestOrdinalElement.ordinal)
}

export function findNextLastOrdinal (lexicographicOrdinal) {
  if (!lexicographicOrdinal) return '1'
  const ordinalPrefix = lexicographicOrdinal.slice(0, -1)
  const ordinalLastChar = lexicographicOrdinal.slice(-1)
  const ordinalIndex = characters.indexOf(ordinalLastChar)
  const nextOrdinalSuffix = characters[ordinalIndex + 1]
  return ordinalPrefix.concat(nextOrdinalSuffix)
}
