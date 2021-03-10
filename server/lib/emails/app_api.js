const _ = require('builders/utils')
const root = require('config').fullPublicHost()

module.exports = {
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
    } else if (/^http/.test(path)) {
      const key = _.hashCode(path)
      const href = _.fixedEncodeURIComponent(path)
      return `${root}/img/remote/${width}x${height}/${key}?href=${href}`
    } else if (_.isEntityUri(path)) {
      return _.buildPath(`${root}/api/entities`, {
        action: 'images',
        uris: path,
        redirect: true,
        width,
        height
      })

    // Assumes this is a Wikimedia Commons filename
    } else if (path[0] !== '/') {
      const file = _.fixedEncodeURIComponent(path)
      return `https://commons.wikimedia.org/w/thumb.php?width=${width}&f=${file}`
    } else {
      path = path.replace('/img/', '')
      return `${root}/img/${width}x${height}/${path}`
    }
  }
}
