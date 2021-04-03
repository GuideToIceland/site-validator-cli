#!/usr/bin/env node
'use strict'

/*
Require statements
 */
const minimist = require('minimist')
const sanitize = require('sanitize-filename')
const pkg = require('./package.json')
const getHelpText = require('./lib/console-texts/get-help-text')
const getSummaryText = require('./lib/console-texts/get-summary-text')
const clearCache = require('./lib/clear-cache')
const getOption = require('./lib/get-option')
const getUrls = require('./lib/get-urls')
const validatePages = require('./lib/validate-pages')
const exportOutput = require('./lib/output/export-output')
const viewOutput = require('./lib/output/view-output')
const { cyanOnBlack } = require('./lib/clc')
const exit = require('./lib/exit')
const ampValidator = require("./lib/ampValidator/ampValidator")
const getUrlsFromFile = require('./lib/helpers-get-urls/get-urls-from-file')
const { validate } = require('fast-xml-parser')

/*
Parsing query parameters
 */
const query = process.argv[2]
const argv = minimist(process.argv.slice(2))
const outputName = `${new Date().toISOString().substring(0, 19).replace(/[:\-_]/gi, '')}`

const options = {
  cacheTime: getOption(['cache', 'cacheTime'], argv),
  clearCache: getOption(['clear-cache', 'clearCache'], argv),
  failfast: getOption(['ff'], argv),
  verbose: getOption(['verbose'], argv),
  quiet: getOption(['quiet'], argv),
  singlePage: getOption(['page'], argv),
  isLocal: getOption(['local', 'isLocal'], argv),
  output: argv.output ? argv.output === true ? outputName : sanitize(argv.output) : false,
  view: getOption(['view'], argv),
  path: argv.path || argv.url ? getOption(['path', 'url'], argv) : argv._[0],
  ignoreError: getOption(['ignoreError'], argv),
  baseUrl: getOption(['baseUrl'], argv),
  ampFile: getOption(['ampFile'], argv),
}

// set cache time (defaults to 60 minutes if unset)
if (options.cacheTime === false) {
  options.cacheTime = 60
}

/*
Process query parameters
 */
var helpKW = ['help', '-h', '--help']
if (!query || helpKW.map(kw => { return process.argv.includes(kw) }).includes(true)) {
  exit(getHelpText())
}

var versionKW = ['version', '-v', '--version']
if (versionKW.map(kw => { return process.argv.includes(kw) }).includes(true)) {
  exit(pkg.version)
}

if (options.view !== false) {
  if (options.view !== true) {
    viewOutput(options.view)
  } else {
    viewOutput(options.path)
  }
}

if (options.path === undefined) {
  if (options.clearCache) {
    clearCache('sitemap')
  }
  exit('No path entered. \nIf path is not the 1st argument, you must prepend it with --url or --path.')
}

(async () => {
  try {
    const pagesToValidate = await getUrls(options)
    console.log(`\Validating the HTML of a total of ${pagesToValidate.length} pages`)
    console.log('═════════════════════════════════════════════════════════════')
    if (options.verbose) { console.log('') }
    const results = await validatePages(pagesToValidate, options)
    const hasErrors = results.some(result => result.errors.length > 0)
    console.log('═════════════════════════════════════════════════════════════')
    console.log(getSummaryText(options.path, results))
    if (options.output) { exportOutput(results, options) }
    exit(cyanOnBlack('Finished Checking, have an A-1 Day!'), hasErrors)
  } catch (error) {
    exit(error, true)
  }
})();

(async () => {
  try {
    const pagesToValidate = await getUrlsFromFile(options.ampFile);
    console.log(`\Running amp validation for a total of ${pagesToValidate.length} pages`)
    console.log('═════════════════════════════════════════════════════════════')
    await ampValidator(options.baseUrl, pagesToValidate);
    //exit(cyanOnBlack('Finished Checking, have an A-1 Day!'))
  } catch (error) {
    exit(error, true)
  }
})();
