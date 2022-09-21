const hasCouchDbDeletedFlag = doc => doc._deleted === true

module.exports = {
  items: hasCouchDbDeletedFlag,
  groups: hasCouchDbDeletedFlag,
  shelves: hasCouchDbDeletedFlag,
  lists: hasCouchDbDeletedFlag,
  users: doc => doc.type === 'deletedUser',
  entities: doc => doc.type === 'removed:placeholder' || doc.redirect != null,
  wikidata: doc => doc.missing != null || doc.type == null || doc.type === 'missing' || doc.redirect != null,
}
