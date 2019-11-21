const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const wpBase = 'https://en.wikipedia.org/w/api.php'
const apiBase = `${wpBase}?action=query&prop=pageimages&format=json&titles=`
const error_ = __.require('lib', 'error/error')

module.exports = title => {
  title = _.fixedEncodeURIComponent(title)
  const url = `${apiBase}${title}`

  return requests_.get(url)
  .then(res => {
    const { pages } = res.query
    const page = _.values(pages)[0]
    const source = _.get(page, 'thumbnail.source')
    if (source) return parseThumbUrl(source)
    else throw error_.notFound(title)
  })
  .then(url => ({
    url,
    credits: {
      text: 'English Wikipedia',
      url: `https://en.wikipedia.org/wiki/${title}`
    }
  })
  )
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
