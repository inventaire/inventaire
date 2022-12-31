import _ from 'builders/utils'
import { buildUrl } from 'lib/utils/url'
import CONFIG from 'config'
const root = CONFIG.getPublicOrigin()

export default {
  // Keep in sync with client/app/api/img
  img: (path, width = 1600, height = 1600) => {
    if (!_.isNonEmptyString(path)) return

    if (path.startsWith('/ipfs/')) {
      console.warn('outdated img path', path)
      return
    }

    // Converting image hashes to a full URL
    if (_.isLocalImg(path) || _.isAssetImg(path)) {
      const [ container, filename ] = path.split('/').slice(2)
      return `${root}/img/${container}/${width}x${height}/${filename}`
    } else if (path.startsWith('http')) {
      const key = _.hashCode(path)
      return buildUrl(`${root}/img/remote/${width}x${height}/${key}`, { href: path })
    } else if (_.isEntityUri(path)) {
      return buildUrl(`${root}/api/entities`, {
        action: 'images',
        uris: path,
        redirect: true,
        width,
        height
      })

    // Assumes this is a Wikimedia Commons filename
    } else if (path[0] !== '/') {
      return buildUrl('https://commons.wikimedia.org/w/thumb.php', { width, f: path })
    } else {
      path = path.replace('/img/', '')
      return `${root}/img/${width}x${height}/${path}`
    }
  }
}
