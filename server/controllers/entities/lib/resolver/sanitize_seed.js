import { compact, isPlainObject } from 'lodash-es'
import { isLang, isNonEmptyString, isUrl } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { forceArray } from '#lib/utils/base'
import properties from '../properties/properties_values_constraints.js'
import { validateProperty } from '../properties/validations.js'
import validateClaimValueSync from '../validate_claim_value_sync.js'

export default (seed, type) => {
  seed.labels = seed.labels || {}
  seed.claims = seed.claims || {}
  validateLabels(seed, type)
  validateAndFormatClaims(seed, type)
  validateImage(seed, type)
}

const validateLabels = (seed, type) => {
  const { labels } = seed
  if (!isPlainObject(labels)) {
    throw error_.new('invalid labels', 400, { seed, type })
  }

  for (const lang in labels) {
    const label = labels[lang]
    if (!isLang(lang)) {
      throw error_.new('invalid label lang', 400, { lang, label, seed, type })
    }

    if (!isNonEmptyString(label)) {
      throw error_.new('invalid label', 400, { lang, label, seed, type })
    }
  }
}

const validateAndFormatClaims = (seed, type) => {
  const { claims } = seed
  if (!isPlainObject(claims)) {
    throw error_.new('invalid claims', 400, { seed })
  }

  Object.keys(claims).forEach(validateAndFormatPropertyClaims(claims, type))
}

const validateAndFormatPropertyClaims = (claims, type) => prop => {
  validateProperty(prop)
  const { format } = properties[prop]
  claims[prop] = compact(forceArray(claims[prop]))
    .map(value => {
      validateClaimValueSync(prop, value, type)
      return format ? format(value) : value
    })
}

const validateImage = (seed, type) => {
  if (seed.image != null) {
    if (type === 'edition') {
      if (!isUrl(seed.image)) {
        throw error_.new('invalid image url', 400, { seed })
      }
    } else {
      throw error_.new(`${type} can't have an image`, 400, { seed })
    }
  }
}
