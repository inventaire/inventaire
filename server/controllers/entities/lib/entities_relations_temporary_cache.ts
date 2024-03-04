import CONFIG from 'config'
import leveldbFactory from '#db/level/get_sub_db'
import { isEntityUri, isPropertyUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { info } from '#lib/utils/logs'
import type { EntityUri, PropertyUri } from '#types/entity'
import type { AbstractIteratorOptions } from 'abstract-leveldown'

const { checkFrequency, ttl } = CONFIG.entitiesRelationsTemporaryCache

const db = leveldbFactory('entities-relations', 'utf8')

type Property = PropertyUri
type ValueUri = EntityUri
type SubjectUri = EntityUri
type EntitiesRelationCacheKey = `${Property}-${ValueUri}-${SubjectUri}`

// This module implements a custom ttl, rather than using level-ttl
// to be able to trigger actions once the ttl expired

export default {
  get: async (property: PropertyUri, valueUri: EntityUri) => {
    const keys = await getKeyRange(property, valueUri)
    return keys.map(getSubject)
  },

  set: async (subjectUri: EntityUri, property: PropertyUri, valueUri: EntityUri) => {
    const key = buildKey(subjectUri, property, valueUri)
    const expireTimeKey = buildExpireTimeKey(key)
    return db.batch([
      { type: 'put', key, value: expireTimeKey },
      { type: 'put', key: expireTimeKey, value: '' },
    ])
  },

  del: async (subjectUri: EntityUri, property: PropertyUri, valueUri: EntityUri) => {
    const key = buildKey(subjectUri, property, valueUri)
    const expireTimeKey = await db.get(key)
    return db.batch([
      { type: 'del', key },
      { type: 'del', key: expireTimeKey },
    ])
    .catch(ignoreKeyNotFound)
  },
}

function getKeyRange (property: PropertyUri, object) {
  const keyBase = `${property}-${object}-`
  return getKeys({
    gte: keyBase,
    lt: keyBase + 'z',
  })
}

async function getKeys (params: AbstractIteratorOptions): Promise<EntitiesRelationCacheKey[]> {
  const keys = []
  return new Promise((resolve, reject) => {
    db.createKeyStream(params)
    .on('data', key => keys.push(key))
    .on('close', () => resolve(keys))
    .on('error', reject)
  })
}

const getSubject = (key: EntitiesRelationCacheKey) => key.split('-')[2]

function buildKey (subjectUri: EntityUri, property: PropertyUri, valueUri: EntityUri) {
  if (!isEntityUri(subjectUri)) throw newError('invalid subject', 500, { subjectUri })
  if (!isPropertyUri(property)) throw newError('invalid property', 500, { property })
  if (!isEntityUri(valueUri)) throw newError('invalid value', 500, { valueUri })
  return `${property}-${valueUri}-${subjectUri}` as EntitiesRelationCacheKey
}

function buildExpireTimeKey (key: EntitiesRelationCacheKey) {
  const expireTime = Date.now() + ttl
  return `expire!${expireTime}!${key}`
}

async function checkExpiredCache () {
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

function ignoreKeyNotFound (err: Error) {
  if (err.name !== 'NotFoundError') throw err
}

setInterval(checkExpiredCache, checkFrequency)
