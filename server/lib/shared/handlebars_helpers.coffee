module.exports = (_, appApi)->
  onePictureOnly = (arg)->
    if _.isArray(arg) then return arg[0] else arg

  getImgDimension = (dimension, defaultValue)->
    if _.isNumber dimension then return dimension
    else defaultValue

  return helpers_ =
    # This is tailored for handlebars, for other uses, use app.API.img directly
    src: (path, width, height)->
      if _.isDataUrl path then return path

      width = getImgDimension width, 1600
      width = _.bestImageWidth width
      height = getImgDimension height, width
      path = onePictureOnly path

      unless path? then return ''

      return appApi.img path, width, height
