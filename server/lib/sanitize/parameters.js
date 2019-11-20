const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const isbn_ = __.require('lib', 'isbn/isbn')

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
  validate: num => _.isNumber(num) && /^\d+$/.test(num.toString())
}

const nonEmptyString = {
  validate: (value, name, config) => {
    let details, message
    if (!_.isString(value)) {
      message = `invalid ${name}`
      details = `expected string, got ${_.typeOf(value)}`
      throw error_.new(`invalid ${name}: ${details}`, 400, { value })
    }

    if (config.length && (value.length !== config.length)) {
      message = `invalid ${name} length`
      details = `expected ${config.length}, got ${value.length}`
      throw error_.new(`${message}: ${details}`, 400, { value })
    }

    return true
  }
}

const arrayOfAKind = validation => (values, kind) => {
  let details
  if (!_.isArray(values)) {
    details = `expected array, got ${_.typeOf(values)}`
    throw error_.new(`invalid ${kind}: ${details}`, 400, { values })
  }

  if (values.length === 0) {
    throw error_.new(`${kind} array can't be empty`, 400)
  }

  for (const value of values) {
    if (!validation(value)) {
      // approximative way to get singular of a word
      const singularKind = kind.replace(/s$/, '')
      details = `expected ${singularKind}, got ${value} (${_.typeOf(values)})`
      throw error_.new(`invalid ${singularKind}: ${details}`, 400, { values })
    }
  }

  return true
}

const arrayOrPipedStrings = value => {
  if (_.isString(value)) { value = value.split('|') }
  if (_.isArray(value)) {
    return _.uniq(value)
  // Let the 'validate' function reject non-arrayfied values
  } else {
    return value
  }
}

const entityUris = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(validations.common.entityUri)
}

const couchUuids = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(validations.common.couchUuid)
}

const arrayOfStrings = {
  format: arrayOrPipedStrings,
  validate: arrayOfAKind(_.isString)
}

const isbn = {
  format: isbn_.normalizeIsbn,
  validate: isbn_.isValidIsbn
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
      if ((limit != null) && (length > limit)) {
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
  filter: whitelistedString,
  generics,
  ids: couchUuids,
  isbn,
  item: couchUuid,
  lang: {
    default: 'en',
    validate: _.isLang
  },
  limit: Object.assign({}, positiveInteger, {
    min: 1,
    default: 100
  }),
  message: nonEmptyString,
  offset: Object.assign({}, positiveInteger, { default: 0 }),
  options: whitelistedStrings,
  password: {
    secret: true,
    validate: validations.user.password
  },
  prefix: whitelistedString,
  property: { validate: _.isPropertyUri },
  refresh: generics.boolean,
  range: Object.assign({}, positiveInteger, {
    default: 50,
    max: 500
  }),
  search: nonEmptyString,
  state: whitelistedString,
  title: nonEmptyString,
  token: nonEmptyString,
  transaction: couchUuid,
  type: whitelistedString,
  types: whitelistedStrings,
  uri: { validate: validations.common.entityUri },
  uris: entityUris,
  user: couchUuid,
  users: couchUuids,
  username: { validate: validations.common.username },
  relatives: whitelistedStrings,
  value: nonEmptyString
}
