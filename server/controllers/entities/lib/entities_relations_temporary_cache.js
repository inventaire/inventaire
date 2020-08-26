const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { promisify } = require('util')
const levelTtl = require('level-ttl')
const { checkFrequency, ttl } = CONFIG.entitiesRelationsTemporaryCache

const db = __.require('level', 'get_sub_db')('entities-relations', 'utf8')
const ttlDb = levelTtl(db, { checkFrequency, defaultTTL: ttl })
const put = promisify(ttlDb.put).bind(ttlDb)
const del = promisify(ttlDb.del).bind(ttlDb)

module.exports = {
  get: async (property, object) => {
    const keys = await getKeyRange(property, object)
    return keys.map(getSubject)
  },

  set: async (subject, property, object) => put(buildKey(subject, property, object), ''),

  del: async (subject, property, object) => del(buildKey(subject, property, object))
}

const getKeyRange = (property, object) => {
  const keys = []
  const keyBase = `${property}-${object}-`
  return new Promise((resolve, reject) => {
    db.createKeyStream({
      gte: keyBase,
      lt: keyBase + 'z'
    })
    .on('data', key => keys.push(key))
    .on('close', () => resolve(keys))
    .on('error', reject)
  })
}

const getSubject = key => key.split('-')[2]

const buildKey = (subject, property, object) => {
  if (!_.isInvEntityUri(subject)) throw error_.new('invalid subject', { subject })
  if (!_.isPropertyUri(property)) throw error_.new('invalid property', { property })
  if (!_.isEntityUri(object)) throw error_.new('invalid object', { object })
  return `${property}-${object}-${subject}`
}
