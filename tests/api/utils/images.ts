import 'should'
import fs, { createReadStream } from 'node:fs'
import { tmpdir } from 'node:os'
import FormData from 'form-data'
import fetch from 'node-fetch'
import downloadImage from '#controllers/images/lib/download_image'
import { createEdition } from '#fixtures/entities'
import { createGroup } from '#fixtures/groups'
import { assertString } from '#lib/utils/assert_types'
import { getRandomString } from '#lib/utils/random_string'
import config from '#server/config'
import { getSomePlaceholderImageUrl } from '#tests/api/utils/placeholder_images'
import { waitForTestServer } from '#tests/api/utils/request'
import type { ImageContainer } from '#types/image'
import { updateClaim } from './entities.js'
import { updateGroup } from './groups.js'
import { updateUser } from './users.js'
import { authReq, getUser } from './utils.js'

const { mediaStorage } = config
const origin = config.getPublicOrigin()
mediaStorage.mode.should.equal('local')
const localStorageFolder = mediaStorage.local.folder()

const uploadImageFromUrl = async ({ container, url }) => {
  return authReq('post', '/api/images?action=convert-url', { container, url })
}

export async function getImageDataUrl (url) {
  url = encodeURIComponent(url)
  const { 'data-url': dataUrl } = await authReq('get', `/api/images?action=data-url&url=${url}`)
  return dataUrl
}

export async function importSomeImage ({ container }) {
  const url = await getSomePlaceholderImageUrl()
  return uploadImageFromUrl({
    container,
    url,
  })
}

export async function uploadSomeImage ({ container, imageFilePath, preventAutoRemove = false }: { container: ImageContainer, imageFilePath?: string, preventAutoRemove?: boolean }) {
  imageFilePath = imageFilePath || `${tmpdir()}/${getRandomString(10)}.jpg`
  const imageUrl = await getSomePlaceholderImageUrl()
  await downloadImage(imageUrl, imageFilePath)
  const { cookie } = await getUser()
  const form = new FormData()
  form.append('somefile', createReadStream(imageFilePath))
  await waitForTestServer
  const res = await fetch(`${origin}/api/images?action=upload&container=${container}`, {
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
}

export function localContainerHasImage ({ container, hash, url }) {
  if (url) [ container, hash ] = url.split('/').slice(2)
  assertString(hash)
  const localImagePath = `${localStorageFolder}/${container}/${hash}`
  try {
    // Using the sync method so that consumers can chain this function with ".shoud.be.true()"
    const res = fs.statSync(localImagePath)
    return res != null
  } catch (err) {
    if (err.code === 'ENOENT') return false
    else throw err
  }
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
