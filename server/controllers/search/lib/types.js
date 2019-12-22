const CONFIG = require('config')

const localAndRemoteEntity = type => ({
  indexes: [ 'wikidata', CONFIG.db.name('entities') ],
  type
})
const remoteOnlyEntity = type => ({
  indexes: [ 'wikidata' ],
  type
})
const localDatabase = (dbBaseName, type) => ({
  indexes: [ CONFIG.db.name(dbBaseName) ],
  type
})

const typesData = {
  works: localAndRemoteEntity('works'),
  humans: localAndRemoteEntity('humans'),
  series: localAndRemoteEntity('series'),
  publishers: localAndRemoteEntity('publishers'),
  genres: remoteOnlyEntity('genres'),
  movements: remoteOnlyEntity('movements'),
  collections: remoteOnlyEntity('collections'),
  users: localDatabase('users', 'user'),
  groups: localDatabase('groups', 'group')
}

const possibleTypes = Object.keys(typesData)

module.exports = { typesData, possibleTypes }
