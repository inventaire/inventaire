#!/usr/bin/env coffee

# NEED to be executed from inventaire root
# folder to get the 'config'
# ex: ./scripts/upload_jpg.coffee ./imageFactory/images/my.jpg


CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
# this script is used to upload static images for both production and development
# thus, images have to go to the PROD container
CONFIG.swift.container = 'img'
require 'colors'
{ putImage } = __.require 'controllers', 'upload/upload'
cp = require 'copy-paste'

[imagePath] = process.argv.slice(2)

filename = imagePath.split('/').slice(-1)[0]

console.log 'imagePath: '.green, imagePath
console.log 'filename: '.green, filename


putImage
  id: filename
  path: imagePath
  keepOldFile: true
.then (res)->
  # _.log res, 'put image res'
  url = "https://inventaire.io#{res.url}"
  cp.copy url
  console.log 'Copied to Clipboard: '.green, url
  process.exit 0
.catch _.Error('putImage err')
