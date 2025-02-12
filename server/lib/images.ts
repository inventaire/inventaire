import { readFile } from 'node:fs/promises'
import gm from 'gm'
import { sha1 } from '#lib/crypto'
import { assertString } from '#lib/utils/assert_types'
import config from '#server/config'
import type { ImageContainer, ImagePath } from '#types/image'

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
  assertString(path)
  return readFile(path)
  .then(sha1)
}

export function shrinkAndFormat (path, width = maxSize, height = maxSize) {
  assertString(path)
  return new Promise((resolve, reject) => shrinkAndFormatStream(path, width, height)
  .write(path, returnPath(path, resolve, reject)))
}

export function removeExif (path: string) {
  assertString(path)
  return new Promise((resolve, reject) => {
    gm(path)
    .noProfile()
    .write(path, returnPath(path, resolve, reject))
  })
}

export const applyImageLimits = (width, height) => [ applyLimit(width), applyLimit(height) ]

export function getUrlFromImageHash (container: ImageContainer, filename: string) {
  if (filename) return `/img/${container}/${filename}` as ImagePath
}

function applyLimit (dimension = maxSize) {
  dimension = Number(dimension)
  return dimension > maxSize ? maxSize : dimension
}

const returnPath = (newPath, resolve, reject) => err => {
  if (err) reject(err)
  else resolve(newPath)
}
