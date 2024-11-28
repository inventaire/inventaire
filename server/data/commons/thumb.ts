// There are no cases in the the app where we would need a higher definition than 1000px
// So using 1000px as max width and resizing from that seems acceptable for a large majority of cases
// Known exception: panoramas, but we don't use those much
import { assert_ } from '#lib/utils/assert_types'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import type { AbsoluteUrl } from '#types/common'
import type { WikimediaCommonsFilename } from '#types/entity'

const width = 1000

export function getWikimediaThumbnailData (file: WikimediaCommonsFilename) {
  assert_.string(file)
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${fixedEncodeURIComponent(file)}?width=${width}` as AbsoluteUrl,
    file,
    credits: {
      text: 'Wikimedia Commons',
      url: `https://commons.wikimedia.org/wiki/File:${file}` as AbsoluteUrl,
    },
  }
}
