import _ from '#builders/utils'
import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'

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

const getAuthorWorksTitles = async olId => {
  _.info(olId, 'olId')
  const url = `${base}?author=${olId}`
  const { docs } = await requests_.get(url, { headers })
  return docs.map(parseResult)
}

const parseResult = result => ({
  title: result.title_suggest,
  url: endpoint + result.key,
})
