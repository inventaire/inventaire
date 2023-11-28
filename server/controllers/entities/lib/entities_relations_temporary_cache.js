import CONFIG from 'config'
import leveldbFactory from '#db/level/get_sub_db'
import { isEntityUri, isPropertyUri } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { emit } from '#lib/radio'
import { info } from '#lib/utils/logs'

const { checkFrequency, ttl } = CONFIG.entitiesRelationsTemporaryCache

const db = leveldbFactory('entities-relations', 'utf8')

// This module implements a custom ttl, rather than using level-ttl
// to be able to trigger actions once the ttl expired

export default {
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
    .catch(ignoreKeyNotFound)
  },
}

const getKeyRange = (property, object) => {
  const keyBase = `${property}-${object}-`
  return getKeys({
    gte: keyBase,
    lt: keyBase + 'z',
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
  if (!isEntityUri(subjectUri)) throw error_.new('invalid subject', { subjectUri })
  if (!isPropertyUri(property)) throw error_.new('invalid property', { property })
  if (!isEntityUri(valueUri)) throw error_.new('invalid value', { valueUri })
  return `${property}-${valueUri}-${subjectUri}`
}

const buildExpireTimeKey = key => {
  const expireTime = Date.now() + ttl
  return `expire!${expireTime}!${key}`
}

const checkExpiredCache = async () => {
  const expiredTimeKeys = await getKeys({
    gt: 'expire!',
    lt: `expire!${Date.now()}`,
  })

  if (expiredTimeKeys.length === 0) return

  const batch = []
  const invalidatedQueriesBatch = []
  for (const expiredTimeKey of expiredTimeKeys) {
    const key = expiredTimeKey.split('!')[2]
    const [ property, valueUri ] = key.split('-')
    invalidatedQueriesBatch.push({ property, valueUri })
    batch.push({ type: 'del', key })
    batch.push({ type: 'del', key: expiredTimeKey })
  }
  await emit('invalidate:wikidata:entities:relations', invalidatedQueriesBatch)
  info(expiredTimeKeys, 'expired entities relations cache')
  await db.batch(batch)
}

const ignoreKeyNotFound = err => {
  if (err.name !== 'NotFoundError') throw err
}

setInterval(checkExpiredCache, checkFrequency)
