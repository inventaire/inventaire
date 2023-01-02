import { containers } from '#controllers/images/lib/containers'
import { md5 } from '#lib/crypto'
import { error_ } from '#lib/error/error'
import downloadImage from './download_image.js'

export default async (container, sourceUrl) => {
  if (containers[container] == null || containers[container].putImage == null) {
    throw error_.newInvalid('container', container)
  }

  const tmpFilename = md5(sourceUrl)
  const tmpPath = `/tmp/${tmpFilename}`

  await downloadImage(sourceUrl, tmpPath)
  return containers[container].putImage({ path: tmpPath })
}
