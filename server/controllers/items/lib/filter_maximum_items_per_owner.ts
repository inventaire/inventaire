import type { SerializedItem } from '#types/item'

export function filterMaximumItemsPerOwner (items: SerializedItem[], lang: string, limit: number) {
  const filteredItems = []
  const discardedItems = []
  const itemsCountByOwner = {}

  for (const item of items) {
    if (filteredItems.length === limit) return filteredItems
    itemsCountByOwner[item.owner] ??= 0
    if ((item.snapshot['entity:lang'] === lang) && (itemsCountByOwner[item.owner] < 3)) {
      itemsCountByOwner[item.owner]++
      filteredItems.push(item)
    } else {
      discardedItems.push(item)
    }
  }

  const missingItemsCount = limit - filteredItems.length
  const itemsToFill = discardedItems.slice(0, missingItemsCount)
  filteredItems.push(...itemsToFill)
  return filteredItems
}
