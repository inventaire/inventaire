#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const split = require('split')
const through = require('through')
const { readFileSync } = require('fs')
const serializeEntityInTurtle = require('./lib/serialize_entity_in_turtle')

const headers = readFileSync(`${__dirname}/headers.ttl`).toString()
// Prefix the dump by the headers
console.log(headers)

const parse = line => {
  try {
    // Omit the last empty line
    if (!_.isNonEmptyString(line)) { return }
    const json = JSON.parse(line.replace(/,$/, ''))
    // Output on process.stdin
    return console.log(serializeEntityInTurtle(json))
  } catch (err) {
    console.error('error line', line)
    return console.error('error', err)
  }
}

process.stdin
.pipe(split())
.pipe(through(parse))
.on('error', _.Error('conversion error'))
