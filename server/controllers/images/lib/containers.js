import CONFIG from 'config'
import _ from '#builders/utils'
import localClient from '#controllers/images/lib/local_client'
import swiftClient from '#controllers/images/lib/swift_client'
import images_ from '#lib/images'
import { emit } from '#lib/radio'

// 'swift' or 'local'
const { mode } = CONFIG.mediaStorage

_.info(`media storage: ${mode}`)

let client
if (mode === 'swift') {
  client = swiftClient
} else {
  client = localClient
}

const { putImage, deleteImage } = client

const transformAndPutImage = (container, fnName) => async fileData => {
  const { id = 0, path } = fileData
  await images_[fnName](path)
  const filename = await images_.getHashFilename(path)
  const url = await putImage(container, path, filename)
  _.log(url, 'new image')
  await emit('image:needs:check', { url, context: 'upload' })
  return { id, url }
}

export const containers = {
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
  assets: {},
}

export const uploadContainersNames = Object.keys(containers)
  .filter(containerName => containers[containerName].putImage != null)
