__ = require('config').root
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
Promise = require 'bluebird'
osmosis = require 'osmosis'

module.exports = (req, res)->
  { file, width } = req.query

  unless file? then return error_.bundle res, 'missing file parameter', 400

  key = "commons:#{file}:#{width}"
  cache_.get key, requestThumb.bind(null, file, width)
  .then res.json.bind(res)
  .catch error_.Handler(res)

requestThumb = (file, width)->
  url = "http://tools.wmflabs.org/magnus-toolserver/commonsapi.php?image=#{file}&thumbwidth=#{width}"

  def = Promise.defer()

  osmosis
  .get url
  .set
    thumbnail: 'thumbnail'
    error: 'error'
    author: 'author'
    license: 'license name'
  .data (data)->
    { thumbnail, error, author } = data
    data.author = removeMarkups author
    if thumbnail? then def.resolve data
    else
      err = new Error(error)
      if error.match('File does not exist') then err.status = 404
      def.reject err

  return def.promise


textInMarkups = /<.+>(.*)<\/\w+>/g
removeMarkups = (text)-> text?.replace textInMarkups, '$1'
