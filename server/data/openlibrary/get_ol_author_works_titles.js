const _ = require('builders/utils')
const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const { oneMonth } = require('lib/time')

const endpoint = 'https://openlibrary.org'
const base = `${endpoint}/search.json`
const headers = { accept: '*/*' }

module.exports = olId => {
  const key = `ol:author-works-titles:${olId}`
  return cache_.get({
    key,
    fn: getAuthorWorksTitles.bind(null, olId),
    timespan: 3 * oneMonth
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
  url: endpoint + result.key
})
