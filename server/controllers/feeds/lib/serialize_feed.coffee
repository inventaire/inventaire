CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Rss = require 'rss'
root = CONFIG.fullPublicHost()
{ feed:feedConfig } = CONFIG
templateHelpers = __.require 'lib', 'emails/handlebars_helpers'
oneDayInMinutes = 24*60

module.exports = (feedOptions, items)->
  { title, queryString, pathname, image } = feedOptions

  feed = new Rss
    title: title
    feed_url: "#{root}/api/feeds/public?#{queryString}"
    site_url: "#{root}/#{pathname}"
    # Could eventually be replaced by a per-feed image
    image_url: feedConfig.image
    # Not always respected, we probably need to cache generated feeds anyway
    # source: http://www.therssweblog.com/?guid=20070529130637
    ttl: oneDayInMinutes

  items.map serializeItem
  .forEach feed.item.bind(feed)

  return feed.xml()

serializeItem = (item)->
  { title } = item
  authors = item.snapshot['entity:authors']
  if _.isNonEmptyString authors then title += " - #{authors}"

  return {
    title: title
    description: getItemDescription item
    guid: item._id
    url: "#{root}/items/#{item._id}"
    date: item.created
    # TODO: use the username as the feed item 'author'
  }

getItemDescription = (item)->
  { title, entity, transaction, pictures, snapshot } = item
  image = pictures[0] or snapshot['entity:image']

  if _.isNonEmptyString image
    imageSrc = templateHelpers.src image, 300
    imageHtml = "<img src='#{imageSrc}' alt='#{title} cover'>"
  else
    imageHtml = ''

  # TODO: replace transaction by a contextualized text
  return "#{imageHtml}<p>#{transaction}</p><p>#{entity}</p>"
