import { simplifyQualifier } from 'wikibase-sdk'
import type { UnprefixedClaims } from '#controllers/entities/lib/create_wd_entity'
import { newError } from '#lib/error/error'
import type { ClaimValueByProperty } from '#types/entity'

export function flattenQualifierProperties (simplifiedClaims, rawClaims) {
  if (simplifiedClaims['wdt:P179']?.length === 1) {
    const { qualifiers: serieQualifiers } = rawClaims.P179[0]
    if (serieQualifiers?.P1545?.length === 1) {
      const simplifiedQualifier = simplifyQualifier(serieQualifiers.P1545[0])
      simplifiedClaims['wdt:P1545'] = [ simplifiedQualifier ]
    }
  }
}

export function relocateQualifierProperties (claims: UnprefixedClaims) {
  const series = claims.P179
  const seriesOrdinals = claims.P1545

  if (!seriesOrdinals) return

  if (!series) {
    throw newError('a serie ordinal can not be move to Wikidata without a serie', 400, { claims })
  }

  if (series.length !== 1) {
    throw newError('a serie ordinal can not be set on several serie claims', 400, { claims })
  }

  if (seriesOrdinals.length !== 1) {
    throw newError('can not import several serie ordinals', 400, { claims })
  }

  const seriesClaim = series[0]
  const seriesOrdinal = seriesOrdinals[0].value as ClaimValueByProperty['wdt:P1545']
  seriesClaim.qualifiers = {
    P1545: [ seriesOrdinal ],
  }

  delete claims.P1545
}

export const qualifierProperties = {
  P1545: {
    claimProperty: 'P179',
    noClaimErrorMessage: 'a serie needs to be set before setting an ordinal',
    tooManyClaimsErrorMessage: 'there needs to be exactly one serie to be allowed to set an ordinal',
  },
}
