import { parseReqForm } from '#controllers/images/lib/parse_form'
import { isNonEmptyPlainObject } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { Log } from '#lib/utils/logs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { Req } from '#types/server'
import { containers, uploadContainersNames } from './lib/containers.js'

const sanitization = {
  nonJsonBody: true,
  container: {
    generic: 'allowlist',
    allowlist: uploadContainersNames,
  },
}

async function controller (params: SanitizedParameters, req: Req) {
  const { container } = params

  const { putImage } = containers[container]

  const form = await parseReqForm(req)
  const files = getFilesFromFormData(form)

  return Promise.all(files.map(putImage))
  .then(indexUrlById)
  .then(Log('uploaded images'))
}

function getFilesFromFormData (formData) {
  const { files } = formData

  if (!isNonEmptyPlainObject(files)) {
    throw newError('no file provided', 400, formData)
  }

  return Object.entries(files).map(([ key, fileArray ]) => {
    assert_.array(fileArray)
    const file = fileArray[0]
    assert_.string(file.filepath)
    file.id = key
    // This somehow does not have any effect: the "path" attribute is undefined when we reach transformAndPutImage
    file.path = file.pathname
    return file
  })
}

function indexUrlById (collection) {
  const index = {}
  collection.forEach(({ id, url }) => {
    index[id] = url
  })
  return index
}

export default { sanitization, controller }
