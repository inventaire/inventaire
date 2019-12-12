const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const host = CONFIG.fullPublicHost()
const error_ = __.require('lib', 'error/error')
const isbn_ = __.require('lib', 'isbn/isbn')
const { truncateLatLng } = __.require('lib', 'geo')

// Parameters attributes:
// - format (optional)
// - validate (required): throws a custom error or returns a boolean.
//   In the case it returns false, the sanitize function will create
//   an error object with an `invalid #{paramName}` message and throw it

const validations = {
  common: __.require('models', 'validations/common'),
  user: __.require('models', 'validations/user')
}

const parseNumberString = value => {
  if (_.isNumber(value)) return value
  const parsedValue = parseFloat(value)
  if (_.isNaN(parsedValue)) return value
  else return parsedValue
}

const couchUuid = {
  validate: validations.common.couchUuid,
  rename: name => `${name}Id`
}

const positiveInteger = {
  format: parseNumberString,
  validate: num => Number.isInteger(num) && num >= 0
}

const nonEmptyString = {
  validate: (value, name, config) => {
    if (!_.isString(value)) {
      const details = `expected string, got ${_.typeOf(value)}`
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

const arrayOfAKind = validation => (values, kind) => {
  if (!_.isArray(values)) {
    const details = `expected array, got ${_.typeOf(values)}`
    throw error_.new(`invalid ${kind}: ${details}`, 400, { values })
  }

  if (values.length === 0) {
    throw error_.new(`${kind} array can't be empty`, 400)
  }

  for (const value of values) {
    if (!validation(value)) {
      // approximative way to get singular of a word
      const singularKind = kind.replace(/s$/, '')
      const details = `expected ${singularKind}, got ${value} (${_.typeOf(values)})`
      throw error_.new(`invalid ${singularKind}: ${details}`, 400, { values })
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

const entityUris = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(validations.common.entityUri)
}

const usernames = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(validations.common.username)
}

const couchUuids = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(validations.common.couchUuid)
}

const arrayOfStrings = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(_.isString)
}

const arrayOfNumbers = {
  validate: arrayOfAKind(_.isNumber)
}

const isbn = {
  format: isbn_.normalizeIsbn,
  validate: isbn_.isValidIsbn
}

const imgUrl = {
  format: (value, name, config) => {
    let decodedUrl = decodeURIComponent(value)
    if (decodedUrl[0] === '/') decodedUrl = `${host}${decodedUrl}`
    return decodedUrl
  },
  validate: validations.common.imgUrl
}

const whitelistedString = {
  validate: (value, name, config) => {
    if (!config.whitelist.includes(value)) {
      const details = `possible values: ${config.whitelist.join(', ')}`
      throw error_.new(`invalid ${name}: ${value} (${details})`, 400, { value })
    }
    return true
  }
}

const whitelistedStrings = {
  format: arrayOrPipedStrings,
  validate: (values, name, config) => {
    for (const value of values) {
      whitelistedString.validate(value, name, config)
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
  }
}

module.exports = {
  authors: arrayOfStrings,
  attribute: nonEmptyString,
  email: { validate: validations.common.email },
  description: nonEmptyString,
  filter: whitelistedString,
  format: whitelistedStrings,
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
  listing: whitelistedString,
  message: nonEmptyString,
  name: nonEmptyString,
  offset: Object.assign({}, positiveInteger, { default: 0 }),
  options: whitelistedStrings,
  owners: couchUuids,
  password: {
    secret: true,
    validate: validations.user.password
  },
  position: {
    format: truncateLatLng,
    validate: arrayOfNumbers.validate
  },
  prefix: whitelistedString,
  property: { validate: _.isPropertyUri },
  refresh: generics.boolean,
  range: Object.assign({}, positiveInteger, {
    default: 50,
    max: 500
  }),
  search: nonEmptyString,
  slug: nonEmptyString,
  state: whitelistedString,
  title: nonEmptyString,
  token: nonEmptyString,
  transaction: couchUuid,
  type: whitelistedString,
  types: whitelistedStrings,
  to: entityUri,
  uri: entityUri,
  uris: entityUris,
  url: imgUrl,
  user: couchUuid,
  users: couchUuids,
  username: { validate: validations.common.username },
  usernames,
  relatives: whitelistedStrings,
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
