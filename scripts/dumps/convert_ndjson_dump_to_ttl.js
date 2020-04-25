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
process.stdout.write(headers + '\n')

const parse = line => {
  // Omit the last empty line
  if (!_.isNonEmptyString(line)) return
  const json = JSON.parse(line.replace(/,$/, ''))
  // Output on process.stdin
  process.stdout.write(serializeEntityInTurtle(json) + '\n')
}

process.stdin
.pipe(split())
.pipe(through(parse))
.on('error', _.Error('conversion error'))
