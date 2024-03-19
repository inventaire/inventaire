import { newError } from '#lib/error/error'

export async function couchdbError (res, context) {
  const body = await res.text()
  let errorText
  if (body[0] === '{') {
    const { error, reason } = JSON.parse(body)
    errorText = `error=${error} reason=${reason}`
  } else {
    errorText = body
  }

  return newError(`${res.statusText} ${errorText}`, res.status, context)
}
