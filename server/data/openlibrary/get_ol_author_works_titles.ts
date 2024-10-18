import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'
import { info } from '#lib/utils/logs'
import type { AbsoluteUrl } from '#types/common'

const endpoint = 'https://openlibrary.org'
const base = `${endpoint}/search.json`
const headers = { accept: '*/*' }

export default olId => {
  const key = `ol:author-works-titles:${olId}`
  return cache_.get({
    key,
    fn: getAuthorWorksTitles.bind(null, olId),
  })
}

async function getAuthorWorksTitles (olId) {
  info(olId, 'olId')
  const url = `${base}?author=${olId}` as AbsoluteUrl
  const { docs } = await requests_.get(url, { headers })
  return docs.map(parseResult)
}

const parseResult = result => ({
  title: result.title_suggest,
  url: endpoint + result.key,
})
