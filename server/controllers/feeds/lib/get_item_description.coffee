CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
templateHelpers = __.require 'lib', 'emails/handlebars_helpers'
transacColors = __.require 'lib', 'emails/activity_summary/transactions_colors'

module.exports = (item, user, lang)->
  { transaction, pictures, snapshot, details } = item
  image = pictures[0] or snapshot['entity:image']
  title = snapshot['entity:title']

  if _.isNonEmptyString image
    imageSrc = templateHelpers.src image, 300
    imageHtml = "<img src='#{imageSrc}' alt='#{title} cover'>"
  else
    imageHtml = ''

  i18nKey = "#{transaction}_personalized_strong"
  transacLabel = templateHelpers.i18n lang, i18nKey, user

  userProfilePic = templateHelpers.src user.picture, 64

  transacColor = transacColors[transaction]

  detailsHtml = if _.isNonEmptyString details then "<p>#{item.details}<p>" else ''

  return """<a href="#{item.href}" alt="#{title}">#{imageHtml}</a>
  <table width="300"><tr>
    <td>
      <a href="#{user.href}" title="#{user.username}">
        <img src="#{userProfilePic}" alt="#{user.username}">
      </a>
    </td>
    <td>
      <a href="#{item.href}" title="#{title}" style="color: white; text-decoration: none; background-color: #{transacColor}; text-align: center; padding: 16px; height: 64px;" >#{transacLabel}</a>
    </td>
  </tr></table>
  #{detailsHtml}
  <small>item:#{item._id} - #{item.entity}<small>"""
