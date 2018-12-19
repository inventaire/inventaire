CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
i18n = require './i18n/i18n'

appApi = require './app_api'

module.exports = _.extend {}, i18n,
  # Prevent passing more than 2 arguments
  debug: (obj, label)->
    _.log obj, label
    return JSON.stringify(obj, null, 2)

  # Keep in sync with client/app/lib/handlebars_helpers/images
  imgSrc: (path, width, height)->
    if isDataUrl path then return path

    width = getImgDimension width, 1600
    width = bestImageWidth width
    height = getImgDimension height, width
    path = onePictureOnly path

    unless path? then return ''

    return appApi.img path, width, height

onePictureOnly = (arg)->
  if _.isArray(arg) then return arg[0] else arg

getImgDimension = (dimension, defaultValue)->
  if _.isNumber dimension then return dimension
  else defaultValue

isDataUrl = (str)-> /^data:image/.test str

bestImageWidth = (width)->
  # under 500, it's useful to keep the freedom to get exactly 64 or 128px etc
  # while still grouping on the initially requested width
  if width < 500 then return width
  # group image width above 500 by levels of 100px to limit generated versions
  else return Math.ceil(width / 100) * 100
