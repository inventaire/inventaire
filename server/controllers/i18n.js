import _ from '#builders/utils'
import { error_ } from '#lib/error/error'
import { appendToClientKeys } from '#lib/i18n_autofix'
import { responses_ } from '#lib/responses'
import { info } from '#lib/utils/logs'

const errorMessagePattern = /^(4|5)00/

// if this route is enabled by CONFIG
// allows the client to notify the server of i18n keys without a value
const i18nMissingKeys = (req, res) => {
  let { missingKeys } = req.body

  if (missingKeys == null) {
    return error_.bundleMissingBody(req, res, 'token')
  }

  if (!areStrings(missingKeys)) {
    return error_.bundleInvalid(req, res, 'missingKeys', missingKeys)
  }

  missingKeys = missingKeys.filter(looksLikeAKey)
  info(missingKeys, 'i18n missing keys')
  appendToClientKeys(missingKeys)

  responses_.ok(res)
}

const looksLikeAKey = key => {
  if (!key) return false
  // Filtering out keys longer than 500 characters
  if (key.length > 500) return false
  // or starting by 400 or 500: its most probably an undesired error message
  if (key.match(errorMessagePattern)) return false
  return true
}

const areStrings = array => _.every(array, _.isString)

export default { post: i18nMissingKeys }
