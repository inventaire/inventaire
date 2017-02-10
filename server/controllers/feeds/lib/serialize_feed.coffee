CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Rss = require 'rss'
root = CONFIG.fullPublicHost()
{ feed:feedConfig } = CONFIG
templateHelpers = __.require 'lib', 'emails/handlebars_helpers'
getItemDescription = require './get_item_description'
oneDayInMinutes = 24*60

module.exports = (feedOptions, users, items)->
  { title, queryString, pathname, image } = feedOptions

  if image then image = templateHelpers.src image, 300
  else image = feedConfig.image

  feed = new Rss
    title: title
    feed_url: "#{root}/api/feeds/public?#{queryString}"
    site_url: "#{root}/#{pathname}"
    image_url: image
    # Not always respected, we probably need to cache generated feeds anyway
    # source: http://www.therssweblog.com/?guid=20070529130637
    ttl: oneDayInMinutes

  usersIndex = _.indexBy users, '_id'

  items.map serializeItem(usersIndex)
  .forEach feed.item.bind(feed)

  return feed.xml()

serializeItem = (usersIndex)-> (item)->
  { title, owner } = item
  user = usersIndex[owner]
  user.href = "#{root}/inventory/#{user._id}"
  item.href = "#{root}/items/#{item._id}"

  data =
    title: getItemTitle item, user
    description: getItemDescription item, user
    author: user.username
    guid: item._id
    url: item.href
    date: item.created

  if _.isArray user.position
    [ lat, long ] = user.position
    data.lat = lat
    data.long = long

  return data

getItemTitle = (item, user)->
  { title, transaction } = item
  authors = item.snapshot['entity:authors']
  if _.isNonEmptyString authors then title += " - #{authors}"

  i18nKey = "#{transaction}_personalized"
  transactionLabel = templateHelpers.i18n 'en', i18nKey, user
  title += " [#{transactionLabel}]"

  return title
