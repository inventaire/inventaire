import CONFIG from 'config'
import _ from '#builders/utils'
import { imageIsUsed as entityImageIsUsed } from '#controllers/entities/lib/entities'
import { imageIsUsed as groupImageIsUsed } from '#controllers/groups/lib/groups'
import { containers } from '#controllers/images/lib/containers'
import { imageIsUsed as userImageIsUsed } from '#controllers/user/lib/user'
import { assert_ } from '#lib/utils/assert_types'

const { checkDelays } = CONFIG.mediaStorage.images

export default async ({ container, hash, url, context }) => {
  if (url) [ container, hash ] = url.split('/').slice(2)
  assert_.string(container)
  assert_.string(hash)
  assert_.string(context)
  const delay = checkDelays[context]
  // Use 'setTimeout' instead of 'wait' to not hold any consumer
  // Especially, in test environment, requests wouldn't respond before radio events are fulfilled
  setTimeout(checkImage.bind(null, container, hash), delay)
}

const checkImage = async (container, hash) => {
  try {
    const isUsed = await checkImagePerContainer[container](hash)
    if (!isUsed) {
      await containers[container].deleteImage(container, hash)
      _.info(`image deleted: /img/${container}/${hash}`)
    }
  } catch (err) {
    // ENOENT (local storage) and 404 (swift storage) are ignored as it is likely
    // to be that 2 checks were requested for the same image, for instance,
    // following an upload and a quick update as it happens especially in tests
    if (!(err.code === 'ENOENT' || err.statusCode === 404)) _.error(err, 'check image error')
  }
}

const checkImagePerContainer = {
  entities: entityImageIsUsed,
  groups: groupImageIsUsed,
  users: userImageIsUsed,
}
