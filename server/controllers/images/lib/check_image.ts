import { imageIsUsed as entityImageIsUsed } from '#controllers/entities/lib/entities'
import { imageIsUsed as groupImageIsUsed } from '#controllers/groups/lib/groups'
import { containers } from '#controllers/images/lib/containers'
import { imageIsUsed as userImageIsUsed } from '#controllers/user/lib/user'
import { assertString } from '#lib/utils/assert_types'
import { info, logError } from '#lib/utils/logs'
import config from '#server/config'

const { checkDelays } = config.mediaStorage.images

export async function checkImage ({ container, hash, url, context }) {
  if (url) [ container, hash ] = url.split('/').slice(2)
  assertString(container)
  assertString(hash)
  assertString(context)
  const delay = checkDelays[context]
  // Use 'setTimeout' instead of 'wait' to not hold any consumer
  // Especially, in test environment, requests wouldn't respond before radio events are fulfilled
  setTimeout(_checkImage.bind(null, container, hash), delay)
}

async function _checkImage (container, hash) {
  try {
    const isUsed = await checkImagePerContainer[container](hash)
    if (!isUsed) {
      await containers[container].deleteImage(container, hash)
      info(`image deleted: /img/${container}/${hash}`)
    }
  } catch (err) {
    // ENOENT (local storage) and 404 (swift storage) are ignored as it is likely
    // to be that 2 checks were requested for the same image, for instance,
    // following an upload and a quick update as it happens especially in tests
    if (!(err.code === 'ENOENT' || err.statusCode === 404)) logError(err, 'check image error')
  }
}

const checkImagePerContainer = {
  entities: entityImageIsUsed,
  groups: groupImageIsUsed,
  users: userImageIsUsed,
}
