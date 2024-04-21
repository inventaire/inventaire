import { readFile } from 'node:fs/promises'
import gm from 'gm'
import { sha1 } from '#lib/crypto'
import config from '#server/config'

const { maxSize } = config.mediaStorage.images

// gm accepts either a path string or a stream
export function shrinkAndFormatStream (data, width, height) {
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

export function getHashFilename (path) {
  return readFile(path)
  .then(sha1)
}

export function shrinkAndFormat (path, width = maxSize, height = maxSize) {
  return new Promise((resolve, reject) => shrinkAndFormatStream(path, width, height)
  .write(path, returnPath(path, resolve, reject)))
}

export function removeExif (path) {
  return new Promise((resolve, reject) => {
    gm(path)
    .noProfile()
    .write(path, returnPath(path, resolve, reject))
  })
}

export const applyImageLimits = (width, height) => [ applyLimit(width), applyLimit(height) ]

export function getUrlFromImageHash (container, filename) {
  if (filename) return `/img/${container}/${filename}`
}

function applyLimit (dimension = maxSize) {
  dimension = Number(dimension)
  return dimension > maxSize ? maxSize : dimension
}

const returnPath = (newPath, resolve, reject) => err => {
  if (err) reject(err)
  else resolve(newPath)
}
