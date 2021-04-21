const _ = require('builders/utils')
const error_ = require('lib/error/error')
const db = require('db/couchdb/base')('images')
const importImage = require('./import_image')

module.exports = sourceImageUrl => importAndAddImage(sourceImageUrl)

const importAndAddImage = async sourceImageUrl => {
  const { url } = await importImage(sourceImageUrl)
  const hash = url.split('/').slice(-1)[0]

  if (!_.isImageHash(hash)) {
    throw error_.new('invalid hash', 500, { sourceImageUrl, hash })
  }

  await saveImageSource(sourceImageUrl, hash)

  return { url, hash }
}

const saveImageSource = async (sourceImageUrl, imageHash) => {
  await db.update(imageHash, doc => {
    doc.sources = doc.sources || []
    doc.sources.push(sourceImageUrl)
    doc.sources = _.uniq(doc.sources)
    doc.updated = Date.now()
    return doc
  }, { createIfMissing: true })
  _.log(sourceImageUrl, `adding source for ${imageHash}`)
}
