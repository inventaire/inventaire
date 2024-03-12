import { mv, rm } from '#lib/fs'
import CONFIG from '#server/config'

const { local: localStorage } = CONFIG.mediaStorage
const storageFolder = localStorage.folder()

const filePath = (container, filename) => `${storageFolder}/${container}/${filename}`

export default {
  putImage: async (container, path, filename) => {
    await mv(path, filePath(container, filename))
    return `/img/${container}/${filename}`
  },

  deleteImage: async (container, filename) => {
    await rm(filePath(container, filename))
  },
}
