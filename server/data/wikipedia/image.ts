import { get } from 'lodash-es'
import { error_ } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { fixedEncodeURIComponent } from '#lib/utils/url'

const wpBase = 'https://en.wikipedia.org/w/api.php'
const apiBase = `${wpBase}?action=query&prop=pageimages&format=json&titles=`

export default async title => {
  title = fixedEncodeURIComponent(title)
  const url = `${apiBase}${title}`

  const { query } = await requests_.get(url)
  const { pages } = query
  const page = Object.values(pages)[0]
  const source = get(page, 'thumbnail.source')
  if (!source) throw error_.notFound(title)

  return {
    url: parseThumbUrl(source),
    credits: {
      text: 'English Wikipedia',
      url: `https://en.wikipedia.org/wiki/${title}`,
    },
  }
}

// using the thumb fully built URL instead of build the URL
// from the filename md5 hash, making it less hazardous
const parseThumbUrl = url => {
  return url
  // Removing the last part
  .split('/')
  .slice(0, -1)
  .join('/')
  // and the thumb name
  .replace('/thumb', '')
}
