import { compact, isPlainObject } from 'lodash-es'
import { formatClaim } from '#controllers/entities/lib/format_claim'
import { validateClaimSync } from '#controllers/entities/lib/validate_claim_sync'
import { isLang, isNonEmptyString, isUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { forceArray, objectEntries } from '#lib/utils/base'
import type { EntityType, InvClaim } from '#server/types/entity'
import type { EditionLooseSeed, EntityLooseSeed } from '#server/types/resolver'
import { validateProperty } from '../properties/validations.js'

export function sanitizeSeed (seed: EntityLooseSeed, type: EntityType) {
  seed.labels = seed.labels || {}
  seed.claims = seed.claims || {}
  validateLabels(seed, type)
  validateAndFormatClaims(seed, type)
  if ('image' in seed) validateImage(seed, type)
}

function validateLabels (seed: EntityLooseSeed, type: EntityType) {
  const { labels } = seed
  if (!isPlainObject(labels)) {
    throw newError('invalid labels', 400, { seed, type })
  }

  for (const lang in labels) {
    const label = labels[lang]
    if (!isLang(lang)) {
      throw newError('invalid label lang', 400, { lang, label, seed, type })
    }

    if (!isNonEmptyString(label)) {
      throw newError('invalid label', 400, { lang, label, seed, type })
    }
  }
}

function validateAndFormatClaims (seed: EntityLooseSeed, type) {
  const { claims } = seed
  if (!isPlainObject(claims)) {
    throw newError('invalid claims', 400, { seed })
  }

  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    validateProperty(property)
    // @ts-ignore In some environment, this produces the error "Expression produces a union type that is too complex to represent.ts(2590)"
    claims[property] = compact(forceArray(propertyClaims))
      .map((claim: InvClaim) => {
        validateClaimSync(property, claim, type)
        return formatClaim(property, claim)
      })
  }
}

function validateImage (seed: EditionLooseSeed, type: EntityType) {
  if (seed.image != null) {
    if (type === 'edition') {
      if (!isUrl(seed.image)) {
        throw newError('invalid image url', 400, { seed })
      }
    } else {
      throw newError(`${type} can't have an image`, 400, { seed })
    }
  }
}
