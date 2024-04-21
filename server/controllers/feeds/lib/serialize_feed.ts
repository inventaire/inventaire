import { isArray, keyBy } from 'lodash-es'
import Rss from 'rss'
import { isNonEmptyString } from '#lib/boolean_validations'
import { imgSrc } from '#lib/emails/handlebars_helpers'
import { i18n } from '#lib/emails/i18n/i18n'
import config from '#server/config'
import type { ImagePath } from '#server/types/image'
import type { RelativeUrl, Url } from '#types/common'
import type { Item, ItemId } from '#types/item'
import type { User } from '#types/user'
import getItemDescription from './get_item_description.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const root = config.getPublicOrigin()
const { feed: feedConfig } = config
const oneDayInMinutes = 24 * 60

interface FeedOptions {
  title: string
  description: string
  queryString: string
  pathname: RelativeUrl
  image?: ImagePath
}

export default (feedOptions: FeedOptions, users: User[], items: Item[], lang: WikimediaLanguageCode) => {
  const { title, description, queryString, pathname } = feedOptions
  let { image } = feedOptions

  if (image) {
    image = imgSrc(image, 300)
  } else {
    image = feedConfig.image
  }

  const feed = new Rss({
    title,
    // Arbitrary limiting the description to 300 characters as it should stay short
    description: description && description.slice(0, 300),
    feed_url: `${root}/api/feeds?${queryString}`,
    site_url: `${root}/${pathname}`,
    image_url: image,
    // Not always respected, we probably need to cache generated feeds anyway
    // source: http://www.therssweblog.com/?guid=20070529130637
    ttl: oneDayInMinutes,
  })

  const usersIndex = keyBy(users, '_id')

  items.map(serializeItem(usersIndex, lang))
  .forEach(feed.item.bind(feed))

  return feed.xml()
}

interface FeedSerializedItem {
  title: string
  description: string
  author: string
  guid: ItemId
  url: Url
  date: EpochTimeStamp
  lat?: number
  long?: number
}

const serializeItem = (usersIndex, lang) => item => {
  const { owner } = item
  const user = usersIndex[owner]
  user.href = `${root}/users/${user._id}`
  item.href = `${root}/items/${item._id}`

  const data: FeedSerializedItem = {
    title: getItemTitle(item, user, lang),
    description: getItemDescription(item, user, lang),
    author: user.username,
    guid: item._id,
    url: item.href,
    date: item.created,
  }

  if (isArray(user.position)) {
    const [ lat, long ] = user.position
    data.lat = lat
    data.long = long
  }

  return data
}

function getItemTitle (item, user, lang) {
  const { transaction, snapshot } = item
  let title = snapshot['entity:title']
  const authors = snapshot['entity:authors']
  if (isNonEmptyString(authors)) { title += ` - ${authors}` }

  const i18nKey = `${transaction}_personalized`
  const transactionLabel = i18n(lang, i18nKey, user)
  title += ` [${transactionLabel}]`

  return title
}
