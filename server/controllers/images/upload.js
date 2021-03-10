const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const parseForm = require('./lib/parse_form')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const containers = require('./lib/containers')
const promises_ = __.require('lib', 'promises')

module.exports = (req, res) => {
  return error_.bundle(req, res, 'due to a technical incident, image upload is disabled today', 503)

  const { container } = req.query

  if ((container == null) || (containers[container] == null)) {
    return error_.bundleInvalid(req, res, 'container', container)
  }

  const { putImage } = containers[container]

  return parseForm(req)
  .then(formData => {
    const files = getFilesFromFormData(formData)
    if (container === 'users') { files.forEach(validateFile) }
    return files
  })
  .then(promises_.map(putImage))
  .then(indexCollection)
  .then(_.Log('upload post res'))
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const getFilesFromFormData = formData => {
  const { files } = formData

  if (!_.isNonEmptyPlainObject(files)) {
    throw error_.new('no file provided', 400, formData)
  }

  for (const key in files) {
    const file = files[key]
    file.id = key
  }

  return _.values(files)
}

const validateFile = file => {
  const { type } = file
  if (type !== 'image/jpeg') {
    throw error_.new('only jpeg are accepted', 400, file)
  }
}

const indexCollection = collection => {
  const index = {}
  for (const data of collection) {
    const { id, url } = data
    index[id] = url
  }
  return index
}
