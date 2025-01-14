import { cleanupImageUrl } from '#data/dataseed/dataseed'
import { isUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { isPrivateUrl } from '#lib/network/is_private_url'
import { assertString } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'
import type { ImageContainer } from '#types/image'
import convertImageUrl from './convert_image_url.js'

const { enabled: dataseedEnabled } = config.dataseed

export async function convertAndCleanupImageUrl ({ container, url }: { container: ImageContainer, url: AbsoluteUrl }) {
  assertString(container)
  assertString(url)
  const originalUrl = url
  if (dataseedEnabled && container === 'entities') {
    const res = await cleanupImageUrl(url)
    url = res.url
  }
  if (!isUrl(url) || (await isPrivateUrl(url))) {
    throw newError('invalid image url', 400, { url, originalUrl })
  }
  const data = await convertImageUrl({ container, url })
  // Returns { hash: undefined } to avoid "Property 'hash' does not exist on type '{}'.ts(2339)"
  if (bannedHashes.has(data.hash)) return { hash: undefined }
  log({ originalUrl, cleanedUrl: url, ...data }, 'convert url')
  return data
}

const bannedHashes = new Set([
  // BNF placeholder
  '34ae223423391eeb6bcd31bf177e77c13aa013a4',
])
