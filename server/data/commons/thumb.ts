// There are no cases in the the app where we would need a higher definition than 1000px
// So using 1000px as max width and resizing from that seems acceptable for a large majority of cases
// Known exception: panoramas, but we don't use those much
import { fixedEncodeURIComponent } from '#lib/utils/url'
import type { AbsoluteUrl } from '#server/types/common'
import type { WikimediaCommonsFilename } from '#server/types/entity'

const width = 1000

export function getWikimediaThumbnailData (file: WikimediaCommonsFilename) {
  if (!file) return {}

  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${fixedEncodeURIComponent(file)}?width=${width}` as AbsoluteUrl,
    file,
    credits: {
      text: 'Wikimedia Commons',
      url: `https://commons.wikimedia.org/wiki/File:${file}` as AbsoluteUrl,
    },
  }
}
