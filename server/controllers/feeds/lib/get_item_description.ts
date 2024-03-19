import { isNonEmptyString } from '#lib/boolean_validations'
import transactionsColors from '#lib/emails/activity_summary/transactions_colors'
import { imgSrc } from '#lib/emails/handlebars_helpers'
import { i18n } from '#lib/emails/i18n/i18n'

export default (item, user, lang) => {
  const { transaction, snapshot, details } = item
  const image = snapshot['entity:image']
  const title = snapshot['entity:title']

  let imageHtml
  if (isNonEmptyString(image)) {
    const imageSrc = imgSrc(image, 300)
    imageHtml = `<img src='${imageSrc}' alt='${title} cover'>`
  } else {
    imageHtml = ''
  }

  const i18nKey = `${transaction}_personalized_strong`
  const transactionLabel = i18n(lang, i18nKey, user)

  const userProfilePic = imgSrc(user.picture, 64)

  const transactionColor = transactionsColors[transaction]

  const detailsHtml = isNonEmptyString(details) ? `<p>${item.details}<p>` : ''

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
