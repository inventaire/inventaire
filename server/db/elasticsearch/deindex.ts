const hasCouchDbDeletedFlag = doc => doc._deleted === true

export default {
  items: hasCouchDbDeletedFlag,
  groups: hasCouchDbDeletedFlag,
  shelves: hasCouchDbDeletedFlag,
  lists: hasCouchDbDeletedFlag,
  users: doc => doc.type === 'deleted',
  entities: doc => doc.type === 'removed:placeholder' || doc.redirect != null,
  wikidata: doc => doc.missing != null || doc.type == null || doc.type === 'missing' || doc.redirects != null,
}
