'use strict'

module.exports = async (page, quiet, isLocal, ignoreError, baseUrl) => {
  const validator = require('html-validator')
  const isNotFound = require('./is-not-found')
  const parseData = require('./parse-data')
  const result = {
    url: page,
    status: undefined,
    errors: []
  }
  const url = `${baseUrl}${page}`;
  try {
    const data = await validator({ url: url, isLocal: isLocal })
    const dataParsed = JSON.parse(data)
    if (isNotFound(dataParsed)) {
      result.status = 'not found'
    } else {
      var errors
      if (quiet) {
        errors = parseData(dataParsed.messages.filter(m => m.type === 'error'))
      } else {
        errors = parseData(dataParsed.messages)
      }
      errors = errors.filter(e => !ignoreError.includes(e.message));
      if (errors.length !== 0) {
        result.status = 'fail'
        result.errors = errors
      } else {
        result.status = 'pass'
      }
    }
  } catch (error) {
    result.status = 'error'
    result.errors.push(error)
  }
  return result
}
