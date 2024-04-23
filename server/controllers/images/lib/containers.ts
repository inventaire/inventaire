import localClient from '#controllers/images/lib/local_client'
import swiftClient from '#controllers/images/lib/swift_client'
import { getHashFilename, removeExif, shrinkAndFormat } from '#lib/images'
import { emit } from '#lib/radio'
import { assert_ } from '#lib/utils/assert_types'
import { log, info } from '#lib/utils/logs'
import config from '#server/config'

// 'swift' or 'local'
const { mode } = config.mediaStorage

info(`media storage: ${mode}`)

let client
if (mode === 'swift') {
  client = swiftClient
} else {
  client = localClient
}

const { putImage, deleteImage } = client

const transformAndPutImage = (container, fn) => async fileData => {
  const { id = 0 } = fileData
  const path = fileData.path || fileData.filepath
  assert_.string(path)
  await fn(path)
  const filename = await getHashFilename(path)
  const url = await putImage(container, path, filename)
  log(url, 'new image')
  await emit('image:needs:check', { url, context: 'upload' })
  return { id, url }
}

export const containers = {
  users: {
    putImage: transformAndPutImage('users', shrinkAndFormat),
    deleteImage,
  },

  groups: {
    putImage: transformAndPutImage('groups', shrinkAndFormat),
    deleteImage,
  },

  entities: {
    putImage: transformAndPutImage('entities', removeExif),
    deleteImage,
  },

  // Placeholder to add 'remote' to the list of containers, when it's actually
  // used to fetch remote images
  remote: {},
  // Same but for emails and client assets
  assets: {},
}

export const uploadContainersNames = [
  'entities',
  'groups',
  'users',
] as const
