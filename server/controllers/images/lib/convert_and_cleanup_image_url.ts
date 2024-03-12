import { cleanupImageUrl } from '#data/dataseed/dataseed'
import { isUrl } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import isPrivateUrl from '#lib/network/is_private_url'
import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import CONFIG from '#server/config'
import type { ImageContainer, Url } from '#types/common'
import convertImageUrl from './convert_image_url.js'

const { enabled: dataseedEnabled } = CONFIG.dataseed

export async function convertAndCleanupImageUrl ({ container, url }: { container: ImageContainer, url: Url }) {
  assert_.string(container)
  assert_.string(url)
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
