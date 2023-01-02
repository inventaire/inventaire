import _ from '#builders/utils'
import getEntityByUri from '#controllers/entities/lib/get_entity_by_uri'
import { buildLink, entityUrl, defaultLabel, propertyLabel } from './helpers.js'
import platforms from './platforms.js'
import propertiesDisplay from './properties_display.js.js'

const typesWithAttachements = Object.keys(propertiesDisplay)

export default async entity => {
  const { claims, type } = entity
  if (!typesWithAttachements.includes(type)) return

  const attachementsList = propertiesDisplay[type]
  const properties = Object.keys(attachementsList)
  const attachements = await Promise.all(properties.map(buildAttachement(claims, attachementsList)))
  return _.compact(attachements)
}

const buildAttachement = (claims, attachementsList) => async prop => {
  const claimValues = claims[prop]
  if (!claimValues) return
  const attachement = {
    type: 'PropertyValue',
    name: propertyLabel(prop)
  }
  const attachementValue = await buildAttachementValues(claimValues, prop, attachementsList)
  if (attachementValue && _.isNonEmptyString(attachementValue)) {
    attachement.value = attachementValue
    return attachement
  }
}

const buildAttachementValues = async (claimValues, prop, attachementsList) => {
  const claimType = attachementsList[prop]
  const attachementValues = await Promise.all(claimValues.map(buildAttachementValue(claimType, prop)))
  return _.compact(attachementValues).join(', ') || null
}

const buildEntity = async ({ claimValue, claimType }) => {
  let attachementValue
  const isWdUri = claimValue && claimValue.startsWith('wd:')
  if (isWdUri) {
    const wdUrl = entityUrl(claimValue)
    const entity = await getEntityByUri({ uri: claimValue })
    const label = defaultLabel(entity)
    attachementValue = claimType === 'entityString' ? label : buildLinkWrapper({ claimValue: wdUrl, text: label })
  }
  if (attachementValue) return attachementValue
}

const buildLinkWrapper = args => {
  const { claimValue, text } = args
  return buildLink(claimValue, text)
}
// only year for now
const buildTime = ({ claimValue }) => parseInt(claimValue.split('-')[0])

const buildPlatform = ({ claimValue, prop }) => {
  const plateformProp = platforms[prop]
  if (!plateformProp) return
  const { url, text } = plateformProp
  const attachementValue = buildLinkWrapper({
    claimValue: url(claimValue),
    text: text(claimValue)
  })
  if (attachementValue) return attachementValue
}

const claimTypesActions = {
  entity: buildEntity,
  entityString: buildEntity,
  string: _.identity,
  time: buildTime,
  platform: buildPlatform,
  url: buildLinkWrapper
}

const buildAttachementValue = (claimType, prop) => async claimValue => {
  const escapeClaimValue = _.escape(claimValue) // html urls
  const claimTypeAction = claimTypesActions[claimType]
  if (claimTypeAction) return claimTypeAction({ claimValue: escapeClaimValue, claimType, prop })
}
