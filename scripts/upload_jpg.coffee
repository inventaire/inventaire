#!/usr/bin/env coffee

# NEED to be executed from inventaire root
# folder to get the 'config'
# ex: ./scripts/upload_jpg.coffee ./imageFactory/images/my.jpg

# use the --raw option to prevent image treatments

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
# this script is used to upload static images for both production and development
# thus, images have to go to the PROD container
CONFIG.swift.container = 'img'
{ putImage, putRawImage } = __.require 'controllers', 'upload/put_image'
cp = require 'copy-paste'
Promise = require 'bluebird'
fs = require 'fs'
{ green } = require 'chalk'

raw = false
imagesPaths = process.argv.slice 2
if imagesPaths[0] is '--raw'
  raw = true
  putImage = putRawImage
  imagesPaths = imagesPaths.slice 1

imageMap = {}

uploadImg = (imagePath)->
  filename = imagePath.split('/').slice(-1)[0]
  console.log green('imagePath: '), imagePath
  console.log green('filename: '), filename
  putImage
    id: filename
    filename: filename
    path: imagePath
    keepOldFile: true
  .then (res)->
    { id, url } = res
    url = "https://inventaire.io#{url}"

    # don't copy to clipboard in raw mode
    if raw
      console.log url
    else
      cp.copy url
      console.log green('Copied to Clipboard: '), url

    imageMap[id] = url
  .catch _.ErrorRethrow('putImage err')

saveImageMap = ->
  path = './uploads_map.json'
  fs.writeFileSync path, JSON.stringify(imageMap, null, 4)
  _.info "#{path} saved"
  process.exit 0

promise = Promise.resolve()

while imagesPaths.length > 0
  imagePath = imagesPaths.pop()
  # chaining promises to make one upload at a time
  promise = promise
    .then uploadImg.bind(null, imagePath)
    .catch _.Error("#{imagePath} err")

promise
.then saveImageMap
.catch _.Error('saving map err')
