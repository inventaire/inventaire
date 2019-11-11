// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const level = require('level')
const sublevel = require('level-sublevel')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = {
  dumpDb(name){
    const db = findDb(name)
    if (db == null) throw new Error('cant find db')

    const dump = {}

    return db.createReadStream()
    .on('data', (data) => {
      console.log(data)
      return dump[data.key] = data.value
    }).on('close', () => {
      const date = new (Date().toISOString().split('T')[0])
      let path = `./${dbName}`
      if (typeof subName !== 'undefined' && subName !== null) { path += `-${subName}` }
      path += `-${date}.json`
      _.info(`writing to ${path}`)
      return _.jsonWrite(path, dump)
    })
  },

  copyFromTo(fromDbName, toDbName){
    const fromDb = findDb(fromDbName)
    const toDb = findDb(toDbName)

    return fromDb.createReadStream()
    .on('data', (data) => {
      console.log(data)
      return toDb.put(data.key, data.value)
    }).on('close', () => _.success('done!'))
  }
}

var findDb = function(name){
  if (name == null) throw new Error('missing name')
  const [ dbName, subName ] = Array.from(name.split(':'))

  const dbPath = __.path('leveldb', dbName)
  if (subName != null) {
    const db = sublevel(level(dbPath))
    return db.sublevel(subName)
  } else {
    return level(dbPath)
  }
}
