import { lazyRefreshSnapshotFromEntity, lazyRefreshSnapshotFromUri } from '#controllers/items/lib/snapshot/refresh_snapshot'
import { radio } from '#lib/radio'

// Items keep some data about their related entities, and those entities graphs
// to make querying items quick, while keeping the required data at end
// to display basic information on the given item.
// This is sort of a caching system, with all the problems related to updating
// cached data.
// The strategy here:
// - update local entities snapshot data directly on change
// - update remote entities snapshot data once in a while:
//   Wikidata's data is assumed to be more reliable, and less changing

// TODO: filter update events by relevance to items snapshots:
// It doesn't matter that some entity got an update on some properties
// that aren't involved in generating the snapshot data. Ex: edition publisher.

// TODO: use the Wikidata recentchanges API to follow remote entities updates
// https://www.wikidata.org/w/api.php?action=help&modules=query%2Brecentchanges

export function updateSnapshotOnEntityChange () {
  radio.on('entity:update:label', lazyRefreshSnapshotFromEntity)
  radio.on('entity:update:claim', lazyRefreshSnapshotFromEntity)
  radio.on('entity:revert:edit', lazyRefreshSnapshotFromEntity)
  radio.on('entity:restore:version', lazyRefreshSnapshotFromEntity)
  radio.on('entity:merge', updateSnapshotOnEntityMerge)
  radio.on('entity:revert:merge', lazyRefreshSnapshotFromUri)
  radio.on('wikidata:entity:refreshed', lazyRefreshSnapshotFromEntity)
  radio.on('entity:changed', lazyRefreshSnapshotFromUri)
}

// Using the toUri as its the URI the items are using now
const updateSnapshotOnEntityMerge = (fromUri, toUri) => lazyRefreshSnapshotFromUri(toUri)
