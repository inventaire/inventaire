import { isArray, isNumber, isPlainObject, isString, uniq } from 'lodash-es'
import { isNonEmptyArray, isLocalActivityPubActorUrl, isLang, isCollection, isPositiveIntegerString, isStrictlyPositiveInteger, isNonEmptyString, isColorHexCode, isPatchId, isPropertyUri, isUserAcct, isCouchUuid, isUserId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { buildLocalUserAcct } from '#lib/federation/remote_user'
import { truncateLatLng } from '#lib/geo'
import { isValidIsbn } from '#lib/isbn/isbn'
import type { RequestParametersPlace } from '#lib/sanitize/sanitize'
import { stringArraySchema } from '#lib/sanitize/schemas'
import { normalizeString, parseBooleanString } from '#lib/utils/base'
import { typeOf } from '#lib/utils/types'
import { isWikimediaLanguageCode } from '#lib/wikimedia'
import common from '#models/validations/common'
import userValidations from '#models/validations/user'
import { isVisibilityKey, isVisibilityKeyArray } from '#models/validations/visibility'
import { publicHost, publicOrigin } from '#server/config'
import type { ControllerSanitizationParameterConfig, RenameFunction } from '#types/controllers_input_sanitization'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

type SanitizationParameterMetadata = Omit<OpenAPIV3.ParameterObject, 'name' | 'in' | 'required'>

interface SanitizationParameter {
  format?: (value: unknown, name: string, config: ControllerSanitizationParameterConfig) => unknown
  // Throws a custom error or returns a boolean.
  // In the case it returns false, the sanitize function will create
  // an error object with an `invalid #{paramName}` message and throw it
  validate: (value: unknown, name: string, config: ControllerSanitizationParameterConfig) => boolean
  rename?: RenameFunction
  metadata?: SanitizationParameterMetadata | ((config: ControllerSanitizationParameterConfig, place: RequestParametersPlace) => SanitizationParameterMetadata)
}

const validations = {
  common,
  user: userValidations,
  visibility: isVisibilityKeyArray,
}

function parseNumberString (value) {
  if (isNumber(value)) return value
  const parsedValue = parseFloat(value)
  if (isNaN(parsedValue)) return value
  else return parsedValue
}

const renameId = name => `${name}Id`

const couchUuidWithoutRenaming = {
  validate: validations.common.couchUuid,
}

const couchUuid = {
  ...couchUuidWithoutRenaming,
  rename: renameId,
}

const positiveInteger = {
  format: parseNumberString,
  validate: num => Number.isInteger(num) && num >= 0,
}

const nonEmptyString = {
  format: (str, name, config) => {
    if (str === '' && config.optional) return
    if (typeof str === 'string') return normalizeString(str)
    // Let the validation throw an error
    else return str
  },
  validate: (value, name, config) => {
    if (value == null && config.optional) return true

    if (!isString(value)) {
      const details = `expected string, got ${typeOf(value)}`
      throw newError(`invalid ${name}: ${details}`, 400, { value })
    }

    if (value.length < 1) {
      const details = `${name} cannot be empty`
      throw newError(`invalid ${name}: ${details}`, 400, { value })
    }

    if (config.length && value.length !== config.length) {
      const message = `invalid ${name} length`
      const details = `expected ${config.length}, got ${value.length}`
      throw newError(`${message}: ${details}`, 400, { value })
    }

    return true
  },
}

const arrayOfAType = validation => (values, type, config) => {
  if (!isArray(values)) {
    const details = `expected array, got ${typeOf(values)}`
    throw newError(`invalid ${type}: ${details}`, 400, { values })
  }

  if (values.length === 0) {
    throw newError(`${type} array can't be empty`, 400)
  }

  for (const value of values) {
    if (!validation(value, type, config)) {
      // approximative way to get singular of a word
      const singularType = type.replace(/s$/, '')
      const details = `expected ${singularType}, got ${value} (${typeOf(value)})`
      throw newError(`invalid ${singularType}: ${details}`, 400, { values })
    }
  }

  return true
}

const arrayOrSeparatedString = separator => value => {
  if (isString(value)) value = value.split(separator)
  if (isArray(value)) return uniq(value).map(formatStringArrayElement)
  // Let the 'validate' function reject non-arrayfied values
  else return value
}

function formatStringArrayElement (str) {
  if (typeof str === 'string') return normalizeString(str)
  // Let the 'validate' function reject non-string values
  else return str
}

const arrayOrPipedString = arrayOrSeparatedString('|')
const arrayOrCommaSeparatedString = arrayOrSeparatedString(',')

const entityUri = {
  validate: validations.common.entityUri,
}

const isbn = { validate: isValidIsbn }

const entityUris: SanitizationParameter = {
  format: arrayOrPipedString,
  validate: arrayOfAType(validations.common.entityUri),
  metadata: (config: ControllerSanitizationParameterConfig, place: RequestParametersPlace) => {
    return {
      description: 'Entities uris',
      style: place === 'query' ? 'pipedDelimited' : undefined,
      schema: stringArraySchema,
    }
  },
}

const emails = {
  format: arrayOrCommaSeparatedString,
  validate: arrayOfAType(validations.common.email),
}

const usernames = {
  format: arrayOrPipedString,
  validate: arrayOfAType(validations.common.username),
}

const couchUuids = {
  format: arrayOrPipedString,
  validate: arrayOfAType(validations.common.couchUuid),
}

const arrayOfNumbers = {
  format: arrayOrPipedString,
  validate: arrayOfAType(isNumber),
}

const imgUrl = {
  format: value => {
    let decodedUrl = decodeURIComponent(value)
    if (decodedUrl[0] === '/') decodedUrl = `${publicOrigin}${decodedUrl}`
    return decodedUrl
  },
  validate: validations.common.imgUrl,
}

const allowlistedString = {
  validate: (value, name, config) => {
    if (!config.allowlist.includes(value)) {
      const details = `possible values: ${config.allowlist.join(', ')}`
      throw newError(`invalid ${name}: ${value} (${details})`, 400, { value })
    }
    return true
  },
}

const allowlistedStrings = {
  format: arrayOrPipedString,
  validate: (values, name, config) => {
    if (!isNonEmptyArray(values)) return false
    for (const value of values) {
      allowlistedString.validate(value, name, config)
    }
    return true
  },
}

const lang = {
  default: 'en',
  validate: (value, name, config) => {
    if (config.type === 'wikimedia') {
      return isWikimediaLanguageCode(value)
    } else {
      return isLang(value)
    }
  },
}

const langs = {
  format: arrayOrPipedString,
  validate: arrayOfAType(lang.validate),
}

const password = {
  secret: true,
  validate: validations.user.password,
}

const user = {
  format: (value, name, config: ControllerSanitizationParameterConfig) => {
    if (config.type === 'acct' && isUserId(value)) return buildLocalUserAcct(value)
    else return value
  },
  validate: (value, name, config: ControllerSanitizationParameterConfig) => {
    if (config.type === 'acct') {
      return isUserAcct(value)
    } else {
      return isCouchUuid(value)
    }
  },
  rename: (name: string, config: ControllerSanitizationParameterConfig) => {
    if (config.type === 'acct') {
      return `${name}Acct`
    } else {
      return `${name}Id`
    }
  },
  metadata: (config: ControllerSanitizationParameterConfig) => {
    if (config.type === 'acct') {
      return {
        description: 'A user account URI',
        example: `9f25f75dba901ddb9817c3e4bf001d85@${publicHost}`,
      }
    } else {
      return {
        description: 'A user account URI',
      }
    }
  },
} as const

// Endpoints accepting a 'value' can specify a type
// or have to do their own validation
// as a value can be anything, including null
const value = {
  validate: (value, name, config) => {
    const { type: expectedType } = config
    if (expectedType) {
      const valueType = typeOf(value)
      if (valueType !== expectedType) {
        throw newError(`invalid value type: ${valueType} (expected ${expectedType})`, 400, { value })
      }
    }
    return true
  },
}

export const genericParameters = {
  allowlist: {
    validate: (value, name, config) => config.allowlist.includes(value),
  },
  boolean: {
    format: (value, name, config) => {
      if (isString(value)) return parseBooleanString(value, config.default)
      else return value
    },
    validate: value => typeOf(value) === 'boolean',
  },
  collection: {
    validate: (values, name, config) => {
      if (!isCollection(values)) return false
      const { limit } = config
      const { length } = values
      if (limit != null && length > limit) {
        throw newError('limit length exceeded', 400, { limit, length })
      }
      return true
    },
  },
  ignore: {
    drop: true,
  },
  object: {
    validate: isPlainObject,
  },
  positiveInteger: {
    format: value => {
      if (isPositiveIntegerString) return parseInt(value)
      else return value
    },
    validate: isStrictlyPositiveInteger,
  },
  string: nonEmptyString,
  stringOrObject: {
    validate: value => isNonEmptyString(value) || isPlainObject(value),
  },
} as const

export const sanitizationParameters: Record<string, SanitizationParameter> = {
  '@context': {
    ...allowlistedStrings,
    metadata: {
      description: 'JSONLD context array',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  accts: {
    format: arrayOrPipedString,
    validate: arrayOfAType(isUserAcct),
    metadata: {
      description: 'User account URIs',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  },
  actor: {
    ...nonEmptyString,
    metadata: {
      description: 'Actor URL',
      schema: {
        type: 'string',
      },
    },
  },
  attribute: nonEmptyString,
  attributes: allowlistedStrings,
  bbox: {
    format: value => {
      if (typeof value === 'string') {
        return JSON.parse(value)
      } else {
        return value
      }
    },
    validate: bbox => {
      if (!isArray(bbox)) return false
      if (bbox.length !== 4) return false
      for (const coordinate of bbox) {
        if (typeOf(coordinate) !== 'number') return false
      }
      const [ minLng, minLat, maxLng, maxLat ] = bbox
      if (minLng >= maxLng || minLat >= maxLat) return false
      if (minLat < -90 || maxLat > 90) return false
      // Let through bbox overlapping the anti-meridian (minLng < -180 || maxLng > 180)
      // but do not let through bboxes overlapping on both sides
      if (minLng < -180 && maxLng > 180) return false
      // or overlapping twice
      if (minLng < -(360 + 180) || maxLng > (360 + 180)) return false
      return true
    },
  },
  color: {
    format: hash => {
      if (typeof hash === 'string') {
        if (hash[0] !== '#') hash = `#${hash}`
        // @ts-expect-error
        return hash.toLowerCase()
      } else {
        return hash
      }
    },
    validate: isColorHexCode,
  },
  comment: nonEmptyString,
  context: {
    validate: value => {
      if (!isVisibilityKey(value)) {
        throw newError(`invalid context: ${value}`, 400, { value })
      }
      return true
    },
  },
  // TODO: rename to old-password
  'current-password': password,
  'entities-type': allowlistedString,
  email: { validate: validations.common.email },
  emails,
  description: nonEmptyString,
  filter: allowlistedString,
  format: allowlistedStrings,
  from: entityUri,
  group: couchUuid,
  id: couchUuidWithoutRenaming,
  ids: couchUuids,
  isbn,
  item: couchUuid,
  items: couchUuids,
  lang,
  langs,
  limit: Object.assign({}, positiveInteger, {
    min: 1,
    default: 100,
  }),
  list: couchUuid,
  lists: couchUuids,
  message: nonEmptyString,
  name: nonEmptyString,
  'new-password': password,
  'new-value': value,
  object: nonEmptyString,
  offset: Object.assign({}, positiveInteger, { default: 0 }),
  'old-value': value,
  options: allowlistedStrings,
  ordinal: positiveInteger,
  owners: couchUuids,
  password,
  patch: {
    validate: isPatchId,
    rename: renameId,
  },
  position: {
    // Do not use arrayOrPipedString, as the array represents a single value,
    // and its elements should not be deduplicated
    format: truncateLatLng,
    validate: arrayOfNumbers.validate,
  },
  prefix: allowlistedString,
  property: { validate: isPropertyUri },
  range: Object.assign({}, positiveInteger, {
    default: 50,
    max: 500,
  }),
  refresh: genericParameters.boolean,
  resource: {
    format: resource => {
      if (isLocalActivityPubActorUrl(resource)) {
        const { host, searchParams } = new URL(resource)
        return `acct:${searchParams.get('name')}@${host}`
      } else {
        return resource
      }
    },
    validate: resource => {
      if (!isString(resource)) return false
      if (resource.startsWith('acct:')) {
        const actorWithHost = resource.slice(5)
        const actorParts = actorWithHost.split('@')
        if (actorParts.length !== 2) return false
        const reqHost = actorParts[1]
        return reqHost === publicHost
      } else if (isLocalActivityPubActorUrl(resource)) {
        return true
      } else {
        return false
      }
    },
  },
  search: nonEmptyString,
  shelf: couchUuid,
  slug: nonEmptyString,
  state: allowlistedString,
  title: nonEmptyString,
  token: nonEmptyString,
  transaction: couchUuid,
  type: allowlistedString,
  types: allowlistedStrings,
  to: entityUri,
  uri: entityUri,
  uris: entityUris,
  url: imgUrl,
  user,
  users: couchUuids,
  username: {
    format: normalizeString,
    validate: validations.common.username,
  },
  usernames,
  relatives: allowlistedStrings,
  requester: couchUuid,
  value,
  visibility: {
    validate: validations.visibility,
  },
} as const
