const { authReq } = require('./utils')

module.exports = {
  getImageDataUrl: async url => {
    url = encodeURIComponent(url)
    const { 'data-url': dataUrl } = await authReq('get', `/api/images?action=data-url&url=${url}`)
    return dataUrl
  }
}
