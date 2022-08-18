const { structuredDataTest } = require('structured-data-testing-tool')
const { Google } = require('structured-data-testing-tool/presets')
const { default: PQueue } = require('p-queue')

const validateUrl = async (url, numberOfRetriesLeft = 2) => {
  await structuredDataTest(url, {
    // Check for compliance with Google, Twitter and Facebook recommendations
    presets: [Google]
  })
    .then(res => {
      console.log(`${url} - ✅ All tests passed!`)
      return res
    })
    .catch(err => {
      if (numberOfRetriesLeft == 0) {
        if (err.type === 'VALIDATION_FAILED') {
          console.log('❌ Some tests failed.')
          result = err.res
        } else {
          console.log(err) // Handle other errors here (e.g. an error fetching a URL)
        }
        process.exit(1)
      }
      console.log('🤞 Retrying structured data validation for' + url)
      validateUrl(url, numberOfRetriesLeft - 1)
    })
}

const validateStructuredDataUrls = async (baseUrl, urls) => {
  const queue = new PQueue({ concurrency: 3 })
  const results = urls.map(page => queue.add(async () => {
    console.log('Structured data validating: ', page)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const result = await validateUrl(`${baseUrl}${page}`)
  }))
  return Promise.all(results)
}

module.exports = { validateStructuredDataUrls }
