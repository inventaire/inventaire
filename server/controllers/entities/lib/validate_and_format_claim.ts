import { validateSnakValueSync } from '#controllers/entities/lib/validate_claim_sync'
import { isNonEmptyPlainObject } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { arrayIncludes, objectEntries } from '#lib/utils/base'
import { isClaimObject } from '#models/entity'
import type { InvClaimObject } from '#server/types/entity'
import { validateProperty } from './properties/validations.js'
import { validateAndFormatClaimValue, type ValidateAndFormatClaimValueParams } from './validate_and_format_claim_value.js'

export async function validateAndFormatClaim (params: ValidateAndFormatClaimValueParams) {
  const { property, newClaim } = params
  validateProperty(property)
  if (newClaim != null && isClaimObject(newClaim)) {
    validateAndFormatReferences(newClaim)
  }
  return validateAndFormatClaimValue(params)
}

function validateAndFormatReferences (claim: InvClaimObject) {
  const { references } = claim
  if (!references) return
  if (!(references instanceof Array)) {
    throw newError('invalid reference array', 400, { claim, references })
  }
  references.forEach(ref => validateAndFormatReference(ref, claim))
}

function validateAndFormatReference (reference: unknown, claim: InvClaimObject) {
  if (!isNonEmptyPlainObject(reference)) {
    throw newError('invalid reference', 400, { reference, claim })
  }
  for (const [ property, values ] of objectEntries(reference)) {
    validateProperty(property)
    if (!(arrayIncludes(allowlistedReferenceProperties, property))) {
      throw newError("This property isn't allowed in reference snaks", 400, { property, allowlistedReferenceProperties })
    }
    if (!(values instanceof Array)) {
      throw newError('invalid snak values array', 400, { property, values })
    }
    reference[property] = values.map(value => validateSnakValueSync(property, value))
  }
}

const allowlistedReferenceProperties = [
  'wdt:P813', // retrieved
  'wdt:P854', // reference URL
] as const
