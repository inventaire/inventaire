const _ = require('builders/utils')
const error_ = require('lib/error/error')
const db = require('db/couchdb/base')('images')
const importImage = require('./import_image')

module.exports = ({ url: sourceImageUrl, container }) => importAndAddImage(container, sourceImageUrl)

const importAndAddImage = async (container, sourceImageUrl) => {
  const { url } = await importImage(container, sourceImageUrl)
  const hash = url.split('/').at(-1)

  if (!_.isImageHash(hash)) {
    throw error_.new('invalid hash', 500, { sourceImageUrl, hash })
  }

  if (container === 'entities') await saveImageSource(sourceImageUrl, hash)

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
