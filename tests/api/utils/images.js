import 'should'
import fs, { createReadStream } from 'node:fs'
import CONFIG from 'config'
import fetch from 'node-fetch'
import FormData from 'form-data'
import downloadImage from '#controllers/images/lib/download_image'
import randomString from '#lib/utils/random_string'
import assert_ from '#lib/utils/assert_types'
import { authReq, getUser } from '../utils/utils.js'
import { createEdition } from '../fixtures/entities.js'
import { createGroup } from '../fixtures/groups.js'
import { updateGroup } from '../utils/groups.js'
import { updateClaim } from './entities.js'
import { updateUser } from './users.js'

const { mediaStorage } = CONFIG
const host = CONFIG.getPublicOrigin()
mediaStorage.mode.should.equal('local')
const localStorageFolder = mediaStorage.local.folder()

const uploadImageFromUrl = async ({ container, url }) => {
  return authReq('post', '/api/images?action=convert-url', { container, url })
}

const someImageUrl = () => `https://via.placeholder.com/1000x1000.jpg?text=${randomString(10)}`

export default {
  getImageDataUrl: async url => {
    url = encodeURIComponent(url)
    const { 'data-url': dataUrl } = await authReq('get', `/api/images?action=data-url&url=${url}`)
    return dataUrl
  },

  importSomeImage: async ({ container }) => {
    return uploadImageFromUrl({
      container,
      url: someImageUrl()
    })
  },

  uploadSomeImage: async ({ container, imageFilePath, preventAutoRemove = false }) => {
    imageFilePath = imageFilePath || `/tmp/${randomString(10)}.jpg`
    const imageUrl = someImageUrl()
    await downloadImage(imageUrl, imageFilePath)
    const { cookie } = await getUser()
    const form = new FormData()
    form.append('somefile', createReadStream(imageFilePath))
    const res = await fetch(`${host}/api/images?action=upload&container=${container}`, {
      method: 'post',
      headers: { cookie, ...form.getHeaders() },
      body: form,
    })
    const { somefile } = await res.json()
    const hash = somefile.split('/')[3]
    if (preventAutoRemove) await useImage[container](hash)
    return {
      statusCode: res.status,
      url: somefile,
      hash,
      imageFilePath,
    }
  },

  localContainerHasImage: ({ container, hash, url }) => {
    if (url) [ container, hash ] = url.split('/').slice(2)
    assert_.string(hash)
    const localImagePath = `${localStorageFolder}/${container}/${hash}`
    try {
      // Using the sync method so that consumers can chain this function with ".shoud.be.true()"
      const res = fs.statSync(localImagePath)
      return res != null
    } catch (err) {
      if (err.code === 'ENOENT') return false
      else throw err
    }
  },
}

const useImage = {
  entities: async hash => {
    const edition = await createEdition()
    const previousHash = edition.claims['invp:P2'][0]
    await updateClaim({ uri: edition.uri, property: 'invp:P2', oldValue: previousHash, newValue: hash })
  },
  groups: async hash => {
    const group = await createGroup()
    await updateGroup({ group, attribute: 'picture', value: `/img/groups/${hash}` })
  },
  users: async hash => {
    await updateUser({ attribute: 'picture', value: `/img/users/${hash}` })
  },
}
