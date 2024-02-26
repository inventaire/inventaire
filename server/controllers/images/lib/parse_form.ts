import { tmpdir } from 'node:os'
import formidable from 'formidable'
import { mkdirp } from '#lib/fs'

const { IncomingForm } = formidable
const uploadDir = `${tmpdir()}/formidable`
await mkdirp(uploadDir)

export default req => new Promise((resolve, reject) => {
  const form = new IncomingForm({ uploadDir })
  return form.parse(req, (err, fields, files) => {
    if (err) reject(err)
    else resolve({ fields, files })
  })
})
