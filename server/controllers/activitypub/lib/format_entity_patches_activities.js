const CONFIG = require('config')
const { makeUrl } = require('root/tests/api/utils/activitypub')
const host = CONFIG.fullPublicHost()

module.exports = rows => {
  return rows.map(formatEntityPatchActivity)
}

const formatEntityPatchActivity = row => {
  const { id: patchId, key, value: property } = row
  const [ uri, timestamp ] = key

  const id = `${host}/api/activitypub?action=activity&id=${patchId}`

  const actor = makeUrl({ params: { action: 'actor', name: uri } })

  const object = {
    id,
    type: 'Note',
    content: `${patchId} -> ${property} -> ${uri}`,
    published: new Date(timestamp).toISOString(),
  }

  return {
    id: `${id}#create`,
    type: 'Create',
    object,
    actor,
    to: 'Public',
  }
}
