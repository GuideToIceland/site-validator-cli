'use strict'

module.exports = async (page, quiet, isLocal, ignoreError, baseUrl) => {
  const validator = require('html-validator')
  const isNotFound = require('./is-not-found')
  const parseData = require('./parse-data')
  const async = require('async')
  const result = {
    url: page,
    status: undefined,
    errors: []
  }
  const url = `${baseUrl}${page}`

  await async.retry({
    times: 10,
    interval: function (retryCount) {
      return 50 * Math.pow(2, retryCount)
    }
  }, (callback) => {
    validator({ url: url, isLocal: isLocal })
      .then(data => JSON.parse(data))
      .then(dataParsed => {
        console.log('Validating: ' + url)
        if (isNotFound(dataParsed)) {
          result.status = 'not found'
          callback(Error('not found'))
        } else {
          var errors
          if (quiet) {
            errors = parseData(dataParsed.messages.filter(m => m.type === 'error'))
          } else {
            errors = parseData(dataParsed.messages)
          }
          errors = errors.filter(e => !ignoreError.includes(e.message))

          if (errors.length !== 0) {
            result.status = 'fail'
            result.errors = errors
            callback(Error(errors))
          } else {
            result.status = 'pass'
            result.errors = []
            callback(result)
          }
        }
      })
      .catch(err => {
        result.status = 'error'
        result.errors.push(err)
        callback(Error(result.errors))
      })
  })

  return result
}
