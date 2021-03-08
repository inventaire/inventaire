const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { checkFrequency, ttl } = CONFIG.entitiesRelationsTemporaryCache
const db = __.require('db', 'level/get_sub_db')('entities-relations', 'utf8')
const radio = __.require('lib', 'radio')

module.exports = {
  get: async (property, valueUri) => {
    const keys = await getKeyRange(property, valueUri)
    return keys.map(getSubject)
  },

  set: async (subjectUri, property, valueUri) => {
    const key = buildKey(subjectUri, property, valueUri)
    const expireTimeKey = buildExpireTimeKey(key)
    return db.batch([
      { type: 'put', key, value: expireTimeKey },
      { type: 'put', key: expireTimeKey, value: '' },
    ])
  },

  del: async (subjectUri, property, valueUri) => {
    const key = buildKey(subjectUri, property, valueUri)
    const expireTimeKey = await db.get(key)
    return db.batch([
      { type: 'del', key },
      { type: 'del', key: expireTimeKey },
    ])
  }
}

const getKeyRange = (property, object) => {
  const keyBase = `${property}-${object}-`
  return getKeys({
    gte: keyBase,
    lt: keyBase + 'z'
  })
}

const getKeys = params => {
  const keys = []
  return new Promise((resolve, reject) => {
    db.createKeyStream(params)
    .on('data', key => keys.push(key))
    .on('close', () => resolve(keys))
    .on('error', reject)
  })
}

const getSubject = key => key.split('-')[2]

const buildKey = (subjectUri, property, valueUri) => {
  if (!_.isEntityUri(subjectUri)) throw error_.new('invalid subject', { subjectUri })
  if (!_.isPropertyUri(property)) throw error_.new('invalid property', { property })
  if (!_.isEntityUri(valueUri)) throw error_.new('invalid value', { valueUri })
  return `${property}-${valueUri}-${subjectUri}`
}

const buildExpireTimeKey = key => {
  const expireTime = Date.now() + ttl
  return `expire!${expireTime}!${key}`
}

const checkExpiredCache = async () => {
  const expiredTimeKeys = await getKeys({
    gt: 'expire!',
    lt: `expire!${Date.now()}`
  })

  if (expiredTimeKeys.length === 0) return

  const batch = []
  for (const expiredTimeKey of expiredTimeKeys) {
    const key = expiredTimeKey.split('!')[2]
    const [ property, valueUri, subjectUri ] = key.split('-')
    await radio.emit('invalidate:wikidata:entities:relations', { subjectUri, property, valueUri })
    batch.push({ type: 'del', key })
    batch.push({ type: 'del', key: expiredTimeKeys })
  }
  await db.batch(batch)
}

setInterval(checkExpiredCache, checkFrequency)
