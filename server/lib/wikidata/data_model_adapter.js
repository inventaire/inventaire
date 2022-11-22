const error_ = require('lib/error/error')
const { qualifier: simplifyQualifier } = require('wikidata-sdk').simplify

const flattenQualifierProperties = (simplifiedClaims, rawClaims) => {
  if (simplifiedClaims['wdt:P179']?.length === 1) {
    const { qualifiers: serieQualifiers } = rawClaims.P179[0]
    if (serieQualifiers?.P1545?.length === 1) {
      const simplifiedQualifier = simplifyQualifier(serieQualifiers.P1545[0])
      simplifiedClaims['wdt:P1545'] = [ simplifiedQualifier ]
    }
  }
}

const relocateQualifierProperties = invEntity => {
  const { claims } = invEntity
  const series = claims.P179
  const seriesOrdinals = claims.P1545

  if (!seriesOrdinals) return

  if (!series) {
    throw error_.new('a serie ordinal can not be move to Wikidata without a serie', 400, invEntity)
  }

  if (series.length !== 1) {
    throw error_.new('a serie ordinal can not be set on several serie claims', 400, invEntity)
  }

  if (seriesOrdinals.length !== 1) {
    throw error_.new('can not import several serie ordinals', 400, invEntity)
  }

  // Using wikibase-edit compact notation
  claims.P179 = {
    value: series[0],
    qualifiers: {
      P1545: seriesOrdinals[0],
    }
  }

  delete claims.P1545
}

const qualifierProperties = {
  P1545: {
    claimProperty: 'P179',
    noClaimErrorMessage: 'a serie needs to be set before setting an ordinal',
    tooManyClaimsErrorMessage: 'there needs to be exactly one serie to be allowed to set an ordinal',
  }
}

module.exports = { flattenQualifierProperties, relocateQualifierProperties, qualifierProperties }
