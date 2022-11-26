const origin = require('config').getPublicOrigin()
const publicHost = origin.split('://')[1]
const { ControllerWrapper } = require('lib/controller_wrapper')

const controller = async params => {
  const { res } = params
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" type="application/xrd+xml" template="${publicHost}/.well-known/webfinger?resource={uri}"/>
</XRD>`
  res.header('content-type', 'application/xrd+xml')
  res.send(xml)
}

module.exports = {
  get: ControllerWrapper({
    access: 'public',
    controller,
  })
}
