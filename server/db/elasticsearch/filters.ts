import { identity } from 'lodash-es'

const isntDesignDoc = doc => !doc._id.startsWith('_design/')

export default {
  entities: isntDesignDoc,
  groups: isntDesignDoc,
  items: isntDesignDoc,
  shelves: isntDesignDoc,
  lists: isntDesignDoc,
  // Do not filter-out doc.type=deletedUser so that deleted users can be unindexed
  users: doc => doc.type === 'user' || doc.type === 'deletedUser',
  // Do not filter-out doc.searchable=false so that toggling this settings does
  // update the document in Elasticsearch and can then be filtered-out at search time
  wikidata: identity,
}
