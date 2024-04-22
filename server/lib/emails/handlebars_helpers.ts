import { isArray } from '#lib/boolean_validations'
import { imgUrlBuilder } from '#lib/emails/app_api'
import { log } from '#lib/utils/logs'

// export default Object.assign({}, i18nHelpers, {
// Prevent passing more than 2 arguments
export function debug (obj, label) {
  log(obj, label)
  return JSON.stringify(obj, null, 2)
}

// Keep in sync with client/app/lib/handlebars_helpers/images
export function imgSrc (path, width: number, height?: number) {
  if (isDataUrl(path)) return path

  width = bestImageWidth(width)
  height = height || width
  path = onePictureOnly(path)

  if (path == null) return ''

  return imgUrlBuilder(path, width, height)
}

export const stringify = obj => typeof obj === 'object' ? JSON.stringify(obj, null, 2) : obj

function onePictureOnly (arg) {
  if (isArray(arg)) return arg[0]
  else return arg
}

const dataUrlPattern = /^data:image/
const isDataUrl = str => dataUrlPattern.test(str)

function bestImageWidth (width: number) {
  // under 500, it's useful to keep the freedom to get exactly 64 or 128px etc
  // while still grouping on the initially requested width
  if (width < 500) {
    return width
  // group image width above 500 by levels of 100px to limit generated versions
  } else {
    return Math.ceil(width / 100) * 100
  }
}
