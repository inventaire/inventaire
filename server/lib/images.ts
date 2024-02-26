import { readFile } from 'node:fs/promises'
import CONFIG from 'config'
import gm from 'gm'
import { sha1 } from '#lib/crypto'

const { maxSize } = CONFIG.mediaStorage.images

// gm accepts either a path string or a stream
export const shrinkAndFormatStream = (data, width, height) => {
  return gm(data)
  .setFormat('jpg')
  // only resize if bigger
  .resize(width, height, '>')
  // removing EXIF data
  .noProfile()
  // replace the alpha layer by a white background
  .flatten()
  // converting to progressive jpeg
  .interlace('Line')
}

export const getHashFilename = path => {
  return readFile(path)
  .then(sha1)
}

export const shrinkAndFormat = (path, width = maxSize, height = maxSize) => {
  return new Promise((resolve, reject) => shrinkAndFormatStream(path, width, height)
  .write(path, returnPath(path, resolve, reject)))
}

export const removeExif = path => {
  return new Promise((resolve, reject) => {
    gm(path)
    .noProfile()
    .write(path, returnPath(path, resolve, reject))
  })
}

export const applyImageLimits = (width, height) => [ applyLimit(width), applyLimit(height) ]

export const getUrlFromImageHash = (container, filename) => {
  if (filename) return `/img/${container}/${filename}`
}

const applyLimit = (dimension = maxSize) => {
  dimension = Number(dimension)
  return dimension > maxSize ? maxSize : dimension
}

const returnPath = (newPath, resolve, reject) => err => {
  if (err) reject(err)
  else resolve(newPath)
}
