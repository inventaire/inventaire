import { tmpdir } from 'node:os'
import formidable, { type Fields, type Files } from 'formidable'
import { mkdirp } from '#lib/fs'

const uploadDir = `${tmpdir()}/formidable`
await mkdirp(uploadDir)

export interface ParsedForm {
  fields: Fields
  files: Files
}

// Parse forms in an early middleware to not let the time to any other middleware
// to start consuming the form request stream, to avoid getting hanging requests
// See https://github.com/node-formidable/formidable/issues/959
export async function parseFormMiddleware (req, res, next) {
  if (!req.headers['content-type']?.startsWith('multipart/form-data')) return next()

  try {
    const form = formidable({ uploadDir })
    const [ fields, files ] = await form.parse(req)
    const reqForm: ParsedForm = { fields, files }
    req.form = reqForm
    next()
  } catch (err) {
    next(err)
  }
}
