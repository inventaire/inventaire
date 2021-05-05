const _ = require('builders/utils')
const templateHelpers = require('lib/emails/handlebars_helpers')
const transactionsColors = require('lib/emails/activity_summary/transactions_colors')

module.exports = (item, user, lang) => {
  const { transaction, snapshot, details } = item
  const image = snapshot['entity:image']
  const title = snapshot['entity:title']

  let imageHtml
  if (_.isNonEmptyString(image)) {
    const imageSrc = templateHelpers.imgSrc(image, 300)
    imageHtml = `<img src='${imageSrc}' alt='${title} cover'>`
  } else {
    imageHtml = ''
  }

  const i18nKey = `${transaction}_personalized_strong`
  const transactionLabel = templateHelpers.i18n(lang, i18nKey, user)

  const userProfilePic = templateHelpers.imgSrc(user.picture, 64)

  const transactionColor = transactionsColors[transaction]

  const detailsHtml = _.isNonEmptyString(details) ? `<p>${item.details}<p>` : ''

  return `<a href="${item.href}" alt="${title}">${imageHtml}</a>
<table width="300"><tr>
  <td>
    <a href="${user.href}" title="${user.username}">
      <img src="${userProfilePic}" alt="${user.username}">
    </a>
  </td>
  <td>
    <a href="${item.href}" title="${title}" style="color: white; text-decoration: none; background-color: ${transactionColor}; text-align: center; padding: 16px; display: block;" >${transactionLabel}</a>
  </td>
</tr></table>
${detailsHtml}
<small>item:${item._id} - ${item.entity}</small>`
}
