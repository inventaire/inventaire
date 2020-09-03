const { flatten, pick, values } = require('lodash')
const { simplify } = require('wikidata-sdk')

const imageClaims = [
  // image
  'P18',
  // logo image
  'P154',
  // collage image
  'P2716'
]

const getCommonsImages = (claims, needSimplification) => {
  const images = flatten(values(pick(claims, imageClaims)))
  if (needSimplification) return images.map(simplify.claim)
  else return images
}

const avatarUrlBuilders = {
  // twitter
  P2002: id => `https://twitter.com/${id}/profile_image?size=original`,
  // facebook
  P2013: id => `https://graph.facebook.com/${id}/picture?type=large`
}

const getAvatars = (claims, needSimplification) => {
  const images = []
  for (const property in avatarUrlBuilders) {
    // Working around differences between Wikidata entities arriving without
    // property prefix and Inventaire entities coming with it
    const prop = property.replace('wdt:', '')
    const websiteClaims = claims[prop] || claims[`wdt:${prop}`]
    if (websiteClaims && websiteClaims[0]) {
      let websiteId = websiteClaims[0]
      if (needSimplification) websiteId = simplify.claim(websiteId)
      images.push(avatarUrlBuilders[prop](websiteId))
    }
  }

  return images
}

module.exports = (claims, needSimplification) => {
  return getCommonsImages(claims, needSimplification)
  .concat(getAvatars(claims, needSimplification))
}
