import { isAssetImg, isEntityUri, isLocalImg, isNonEmptyString } from '#lib/boolean_validations'
import { getHashCode } from '#lib/utils/base'
import { buildUrl } from '#lib/utils/url'
import { publicOrigin } from '#server/config'
import type { AbsoluteUrl } from '#types/common'

// Keep in sync with client/app/api/img
export function imgUrlBuilder (path, width = 1600, height = 1600) {
  if (!isNonEmptyString(path)) return

  if (path.startsWith('/ipfs/')) {
    console.warn('outdated img path', path)
    return
  }

  // Converting image hashes to a full URL
  if (isLocalImg(path) || isAssetImg(path)) {
    const [ container, filename ] = path.split('/').slice(2)
    return `${publicOrigin}/img/${container}/${width}x${height}/${filename}`
  } else if (path.startsWith('http')) {
    const key = getHashCode(path)
    const pathname: AbsoluteUrl = `${publicOrigin}/img/remote/${width}x${height}/${key}`
    return buildUrl(pathname, { href: path })
  } else if (isEntityUri(path)) {
    const pathname: AbsoluteUrl = `${publicOrigin}/api/entities`
    return buildUrl(pathname, {
      action: 'images',
      uris: path,
      redirect: true,
      width,
      height,
    })

  // Assumes this is a Wikimedia Commons filename
  } else if (path[0] !== '/') {
    return buildUrl('https://commons.wikimedia.org/w/thumb.php', { width, f: path })
  } else {
    path = path.replace('/img/', '')
    return `${publicOrigin}/img/${width}x${height}/${path}`
  }
}
