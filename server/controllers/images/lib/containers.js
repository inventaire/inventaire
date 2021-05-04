const images_ = require('lib/images')
const putImage = require('./put_image')

const containerPutImage = (container, fnName) => async fileData => {
  const { id = 0, path } = fileData
  await images_[fnName](path)
  const filename = images_.getHashFilename(path)
  return putImage(container, path, id, filename)
}

module.exports = {
  users: {
    putImage: containerPutImage('users', 'shrinkAndFormat')
  },

  groups: {
    putImage: containerPutImage('groups', 'shrinkAndFormat')
  },

  entities: {
    putImage: containerPutImage('entities', 'removeExif')
  },

  // Placeholder to add 'remote' to the list of containers, when it's actually
  // used to fetch remote images
  remote: {},
  // Same but for emails and client assets
  assets: {}
}
