import { isNonEmptyPlainObject } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { Log } from '#lib/utils/logs'
import { containers, uploadContainersNames } from './lib/containers.js'
import parseForm from './lib/parse_form.js'

const sanitization = {
  nonJsonBody: true,
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames,
  },
}

const controller = async (params, req) => {
  const { container } = params

  const { putImage } = containers[container]

  const files = await parseForm(req).then(getFilesFromFormData)
  if (container === 'users') files.forEach(validateFile)

  return Promise.all(files.map(putImage))
  .then(indexUrlById)
  .then(Log('uploaded images'))
}

const getFilesFromFormData = formData => {
  const { files } = formData

  if (!isNonEmptyPlainObject(files)) {
    throw newError('no file provided', 400, formData)
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
    throw newError('only jpeg are accepted', 400, file)
  }
}

const indexUrlById = collection => {
  const index = {}
  collection.forEach(({ id, url }) => {
    index[id] = url
  })
  return index
}

export default { sanitization, controller }
