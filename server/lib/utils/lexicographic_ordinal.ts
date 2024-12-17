import { maxBy } from 'lodash-es'
import { findOrdinalBetween } from '#lib/find_ordinal'
import type { ListingElement } from '#types/element'

export function findNewOrdinal (element: ListingElement, elements: ListingElement[], inclusiveOrdinal: number) {
  // Format from a more human readable "inclusive" order (starting by 1, 2, 3)
  // to more bot readable "exclusive" order (starting by 0, 1, 2)
  // see http://kilby.stanford.edu/~rvg/ordinal.html
  let newOrdinal = inclusiveOrdinal - 1

  // Place element in last position if newOrdinal is too high
  if (elements.length < newOrdinal) newOrdinal = elements.length - 1
  if (elements[newOrdinal]?._id === element._id) return
  removeElementIfNecessary(element, elements, newOrdinal)
  return findNewLexicographicOrdinal(newOrdinal, elements)
}

function removeElementIfNecessary (element: ListingElement, elements: ListingElement[], newOrdinal) {
  // A make-it-fast implementation: find index from a subset of element,
  // as element must be removed only if its being moved up in the listing
  // hence only if element is between first element and newOrdinal element
  const listingSubset = elements.slice(0, newOrdinal)
  const index = listingSubset.findIndex(el => el._id === element._id)
  if (index !== -1) elements.splice(index, 1)
}

function findNewLexicographicOrdinal (newOrdinal: number, currentElements: ListingElement[]) {
  let precedentElementIndex, beforeOrdinal
  if (newOrdinal === 0) {
    precedentElementIndex = 0
    // See getNextHighestOrdinal comment on why '0' can be set as beforeOrdinal
    beforeOrdinal = '0'
  } else {
    precedentElementIndex = newOrdinal - 1
    beforeOrdinal = currentElements[precedentElementIndex].ordinal
  }
  const afterElement = currentElements[newOrdinal]
  let afterOrdinal
  if (!afterElement) {
    afterOrdinal = getNextHighestOrdinal(currentElements)
  } else {
    afterOrdinal = afterElement.ordinal
  }
  const lexicographicOrdinal = findOrdinalBetween(beforeOrdinal, afterOrdinal)
  if (currentElements[precedentElementIndex]?.ordinal !== lexicographicOrdinal) {
    return lexicographicOrdinal
  }
}

export function getNextHighestOrdinal (elements: ListingElement[]) {
  // First element's ordinal can not be the first lexicographical possibility (aka '0'),
  // since some ordinal slots should be available before first element,
  // to be able to replace first element when needed.
  // Taking the second lexicographical ordinal (as first ordinal ever assigned in a list),
  // should leave enough slots range (everything starting by '0').
  if (elements.length === 0) return '1'
  const highestOrdinalElement = maxBy(elements, 'ordinal')
  return findNextLastOrdinal(highestOrdinalElement.ordinal)
}

export function findNextLastOrdinal (lexicographicOrdinal = '') {
  if (lexicographicOrdinal.length < 4) {
    return lexicographicOrdinal + '1'
  } else {
    // Uses the correspondance between the lexicographic ordinals characters
    // and the base-36 figures to find the next lexicographic ordinals
    // that doesn't requires increasing the ordinals length
    const nextOrdinal = parseInt(lexicographicOrdinal, 36) + 1
    const nextOrdinalStr = nextOrdinal.toString(36)
    if (nextOrdinalStr.length > lexicographicOrdinal.length) {
      return lexicographicOrdinal + '1'
    } else {
      return nextOrdinalStr
    }
  }
}
