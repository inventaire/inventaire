const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const host = CONFIG.fullPublicHost()
const error_ = require('lib/error/error')
const { truncateLatLng } = require('lib/geo')
const { isValidIsbn } = require('lib/isbn/isbn')

// Parameters attributes:
// - format (optional)
// - validate (required): throws a custom error or returns a boolean.
//   In the case it returns false, the sanitize function will create
//   an error object with an `invalid #{paramName}` message and throw it

const validations = {
  common: require('models/validations/common'),
  user: require('models/validations/user')
}

const parseNumberString = value => {
  if (_.isNumber(value)) return value
  const parsedValue = parseFloat(value)
  if (_.isNaN(parsedValue)) return value
  else return parsedValue
}

const renameId = name => `${name}Id`

const couchUuid = {
  validate: validations.common.couchUuid,
  rename: renameId
}

const positiveInteger = {
  format: parseNumberString,
  validate: num => Number.isInteger(num) && num >= 0
}

const nonEmptyString = {
  format: str => {
    if (typeof str === 'string') return str.normalize().trim()
    // Let the validation throw an error
    else return str
  },
  validate: (value, name, config) => {
    if (!_.isString(value)) {
      const details = `expected string, got ${_.typeOf(value)}`
      throw error_.new(`invalid ${name}: ${details}`, 400, { value })
    }

    if (value.length < 1) {
      const details = `${name} cannot be empty`
      throw error_.new(`invalid ${name}: ${details}`, 400, { value })
    }

    if (config.length && value.length !== config.length) {
      const message = `invalid ${name} length`
      const details = `expected ${config.length}, got ${value.length}`
      throw error_.new(`${message}: ${details}`, 400, { value })
    }

    return true
  }
}

const arrayOfAType = validation => (values, type) => {
  if (!_.isArray(values)) {
    const details = `expected array, got ${_.typeOf(values)}`
    throw error_.new(`invalid ${type}: ${details}`, 400, { values })
  }

  if (values.length === 0) {
    throw error_.new(`${type} array can't be empty`, 400)
  }

  for (const value of values) {
    if (!validation(value)) {
      // approximative way to get singular of a word
      const singularType = type.replace(/s$/, '')
      const details = `expected ${singularType}, got ${value} (${_.typeOf(values)})`
      throw error_.new(`invalid ${singularType}: ${details}`, 400, { values })
    }
  }

  return true
}

const arrayOrPipedStrings = value => {
  if (_.isString(value)) value = value.split('|')
  if (_.isArray(value)) return _.uniq(value)
  // Let the 'validate' function reject non-arrayfied values
  else return value
}

const entityUri = {
  validate: validations.common.entityUri
}

const isbn = { validate: isValidIsbn }

const entityUris = {
  format: arrayOrPipedStrings,
  validate: arrayOfAType(validations.common.entityUri)
}

const usernames = {
  format: arrayOrPipedStrings,
  validate: arrayOfAType(validations.common.username)
}

const couchUuids = {
  format: arrayOrPipedStrings,
  validate: arrayOfAType(validations.common.couchUuid)
}

const arrayOfNumbers = {
  validate: arrayOfAType(_.isNumber)
}

const imgUrl = {
  format: (value, name, config) => {
    let decodedUrl = decodeURIComponent(value)
    if (decodedUrl[0] === '/') decodedUrl = `${host}${decodedUrl}`
    return decodedUrl
  },
  validate: validations.common.imgUrl
}

const allowlistedString = {
  validate: (value, name, config) => {
    if (!config.allowlist.includes(value)) {
      const details = `possible values: ${config.allowlist.join(', ')}`
      throw error_.new(`invalid ${name}: ${value} (${details})`, 400, { value })
    }
    return true
  }
}

const allowlistedStrings = {
  format: arrayOrPipedStrings,
  validate: (values, name, config) => {
    for (const value of values) {
      allowlistedString.validate(value, name, config)
    }
    return true
  }
}

const generics = {
  boolean: {
    format: (value, name, config) => {
      if (_.isString(value)) return _.parseBooleanString(value, config.default)
      else return value
    },
    validate: value => _.typeOf(value) === 'boolean'
  },
  object: {
    validate: _.isPlainObject
  },
  collection: {
    validate: (values, name, config) => {
      if (!_.isCollection(values)) return false
      const { limit } = config
      const { length } = values
      if (limit != null && length > limit) {
        throw error_.new('limit length exceeded', 400, { limit, length })
      }
      return true
    }
  },
  positiveInteger: {
    format: value => {
      if (_.isPositiveIntegerString) return parseInt(value)
      else return value
    },
    validate: _.isStrictlyPositiveInteger
  }
}

module.exports = {
  attribute: nonEmptyString,
  bbox: {
    format: value => {
      return JSON.parse(value)
    },
    validate: (bbox, name, config) => {
      if (_.typeOf(bbox) !== 'array') return false
      if (bbox.length !== 4) return false
      for (const coordinate of bbox) {
        if (_.typeOf(coordinate) !== 'number') return false
      }
      const [ minLng, minLat, maxLng, maxLat ] = bbox
      if (minLng >= maxLng || minLat >= maxLat) return false
      if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) return false
      return true
    }
  },
  email: { validate: validations.common.email },
  description: nonEmptyString,
  filter: allowlistedString,
  format: allowlistedStrings,
  from: entityUri,
  generics,
  group: couchUuid,
  id: couchUuid,
  ids: couchUuids,
  isbn,
  item: couchUuid,
  items: couchUuids,
  lang: {
    default: 'en',
    validate: _.isLang
  },
  limit: Object.assign({}, positiveInteger, {
    min: 1,
    default: 100
  }),
  listing: allowlistedString,
  message: nonEmptyString,
  name: nonEmptyString,
  offset: Object.assign({}, positiveInteger, { default: 0 }),
  options: allowlistedStrings,
  owners: couchUuids,
  password: {
    secret: true,
    validate: validations.user.password
  },
  patch: {
    validate: _.isPatchId,
    rename: renameId
  },
  position: {
    format: truncateLatLng,
    validate: arrayOfNumbers.validate
  },
  prefix: allowlistedString,
  property: { validate: _.isPropertyUri },
  refresh: generics.boolean,
  range: Object.assign({}, positiveInteger, {
    default: 50,
    max: 500
  }),
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
  user: couchUuid,
  users: couchUuids,
  username: { validate: validations.common.username },
  usernames,
  relatives: allowlistedStrings,
  requester: couchUuid,
  value: {
    // Endpoints accepting a 'value' can specify a type
    // or have to do their own validation
    // as a value can be anything, including null
    validate: (value, name, config) => {
      const { type: expectedType } = config
      if (expectedType) {
        const valueType = _.typeOf(value)
        if (valueType !== expectedType) {
          throw error_.new(`invalid value type: ${valueType} (expected ${expectedType})`, 400, { value })
        }
      }
      return true
    }
  }
}
