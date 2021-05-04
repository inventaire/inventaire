const _ = require('builders/utils')
// 'swift' or 'local'
const { mode } = require('config').mediaStorage
_.info(`media storage: ${mode}`)
const { putImage, deleteImage } = require(`./${mode}_client`)
const images_ = require('lib/images')

const transformAndPutImage = (container, fnName) => async fileData => {
  const { id = 0, path } = fileData
  await images_[fnName](path)
  const filename = await images_.getHashFilename(path)
  const url = await putImage(container, path, filename)
  _.log(url, 'new image url')
  return { id, url }
}

module.exports = {
  users: {
    putImage: transformAndPutImage('users', 'shrinkAndFormat'),
    deleteImage,
  },

  groups: {
    putImage: transformAndPutImage('groups', 'shrinkAndFormat'),
    deleteImage,
  },

  entities: {
    putImage: transformAndPutImage('entities', 'removeExif'),
    deleteImage,
  },

  // Placeholder to add 'remote' to the list of containers, when it's actually
  // used to fetch remote images
  remote: {},
  // Same but for emails and client assets
  assets: {}
}
