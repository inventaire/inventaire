import { resolve } from 'node:path'
import { projectRoot } from '#lib/absolute_path'
import { mv, rm } from '#lib/fs'
import config from '#server/config'

const { local: localStorage } = config.mediaStorage
export const localStorageFolder = resolve(projectRoot, localStorage.folder)

const filePath = (container, filename) => `${localStorageFolder}/${container}/${filename}`

export default {
  putImage: async (container, path, filename) => {
    await mv(path, filePath(container, filename))
    return `/img/${container}/${filename}`
  },

  deleteImage: async (container, filename) => {
    await rm(filePath(container, filename))
  },
}
