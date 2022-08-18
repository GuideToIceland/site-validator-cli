'use strict'

module.exports = async (pagesToValidate, options) => {
  const { default: PQueue } = require('p-queue')
  const validatePage = require('./helpers-validate-pages/validate-page')
  const getResultText = require('./console-texts/get-result-text')
  const failFast = require('./helpers-validate-pages/fail-fast')
  const queue = new PQueue({ concurrency: 3 })
  const pagesNotFound = []
  const pagesFail = []
  const recursiveValidatePage = async (page, numberOfRetries = 2) => {
    const result = await validatePage(page, options.quiet, options.isLocal, options.ignoreError, options.baseUrl);
    if(result.errors.length !== 0 && numberOfRetries !== 0) {
      console.log("Error", result.errors);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await recursiveValidatePage(page, numberOfRetries - 1);
    }
    return result;
  }
  const results = pagesToValidate.map(page => queue.add(async () => {
    const result = await recursiveValidatePage(page);

    if (result.status === 'not found') { pagesNotFound.push(page) }
    if (result.errors.length !== 0) { pagesFail.push(page) }
    if (options.failfast) { failFast(pagesNotFound, pagesFail) }
    return result
  }))
  return Promise.all(results)
}
