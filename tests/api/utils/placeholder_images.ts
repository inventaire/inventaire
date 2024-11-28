import gm from 'gm'
import { absolutePath } from '#lib/absolute_path'
import { getRandomString } from '#lib/utils/random_string'
import { startGenericMockServer } from '#tests/integration/utils/mock_server'
import type { AbsoluteUrl } from '#types/common'
import type { Response } from 'express'

const baseImagePath = absolutePath('client', 'app/assets/icon/120.png')

function sendCustomImage (res: Response, text: string) {
  res.set('content-type', 'image/png')
  gm(baseImagePath)
  .drawText(30, 20, text)
  .stream()
  .pipe(res)
}

async function startImagePlaceholderServer () {
  const { origin } = await startGenericMockServer(app => {
    app.get('/:text', (req, res) => {
      sendCustomImage(res, req.params.text)
    })
  })
  return { origin }
}

let serverPromise: ReturnType<typeof startImagePlaceholderServer>
export async function getSomePlaceholderImageUrl () {
  serverPromise ??= startImagePlaceholderServer()
  const { origin } = (await serverPromise)
  const url: AbsoluteUrl = `${origin}/${getRandomString(10)}`
  return url
}
