// Accepting image/*
// Accepting application/octet-stream (known case: media storages 'dumb' content type)
const imageContentTypePattern = /^(image\/[\w+-.]+|application\/octet-stream)$/

module.exports = contentType => {
  if (!contentType) return false
  contentType = contentType.replace(';charset=UTF-8', '')
  return imageContentTypePattern.test(contentType)
}
