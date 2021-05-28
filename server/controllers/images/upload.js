const _ = require('builders/utils')
const parseForm = require('./lib/parse_form')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { containers, uploadContainersNames } = require('./lib/containers')
const { sanitizeSync } = require('lib/sanitize/sanitize')

const sanitization = {
  nonJsonBody: true,
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames
  },
}

module.exports = (req, res) => {
  upload(req, res)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const upload = async (req, res) => {
  // Use the sync version of sanitize so that parseForm below doesn't miss req 'data' events
  const { container } = sanitizeSync(req, res, sanitization)

  const { putImage } = containers[container]

  const files = await parseForm(req).then(getFilesFromFormData)
  if (container === 'users') files.forEach(validateFile)

  return Promise.all(files.map(putImage))
  .then(indexUrlById)
  .then(_.Log('uploaded images'))
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

  return Object.values(files)
}

const validateFile = file => {
  const { type } = file
  if (type !== 'image/jpeg') {
    throw error_.new('only jpeg are accepted', 400, file)
  }
}

const indexUrlById = collection => {
  const index = {}
  collection.forEach(({ id, url }) => {
    index[id] = url
  })
  return index
}
