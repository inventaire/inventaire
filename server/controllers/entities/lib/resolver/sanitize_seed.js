const _ = require('builders/utils')
const error_ = require('lib/error/error')
const properties = require('../properties/properties_values_constraints')
const validateClaimValueSync = require('../validate_claim_value_sync')
const { validateProperty } = require('../properties/validations')

module.exports = (seed, type) => {
  seed.labels = seed.labels || {}
  seed.claims = seed.claims || {}
  validateLabels(seed)
  validateAndFormatClaims(seed, type)
  validateImage(seed, type)
}

const validateLabels = seed => {
  const { labels } = seed
  if (!_.isPlainObject(labels)) {
    throw error_.new('invalid labels', 400, { seed })
  }

  for (const lang in labels) {
    const label = labels[lang]
    if (!_.isLang(lang)) {
      throw error_.new('invalid label lang', 400, { lang, label })
    }

    if (!_.isNonEmptyString(label)) {
      throw error_.new('invalid label', 400, { lang, label })
    }
  }
}

const validateAndFormatClaims = (seed, type) => {
  const { claims } = seed
  if (!_.isPlainObject(claims)) {
    throw error_.new('invalid claims', 400, { seed })
  }

  Object.keys(claims).forEach(validateAndFormatPropertyClaims(claims, type))
}

const validateAndFormatPropertyClaims = (claims, type) => prop => {
  validateProperty(prop)
  const { format } = properties[prop]
  claims[prop] = _.forceArray(claims[prop])
    .map(value => {
      validateClaimValueSync(prop, value, type)
      return format ? format(value) : value
    })
}

const validateImage = (seed, type) => {
  if (seed.image != null) {
    if (type === 'edition') {
      if (!_.isUrl(seed.image)) {
        throw error_.new('invalid image url', 400, { seed })
      }
    } else {
      throw error_.new(`${type} can't have an image`, 400, { seed })
    }
  }
}
