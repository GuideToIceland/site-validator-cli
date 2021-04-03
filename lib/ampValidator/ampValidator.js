/* eslint-disable no-console */
const fs = require("fs");

const nodeFetch = require("isomorphic-unfetch");
const amphtmlValidator = require("amphtml-validator");
const { default: PQueue } = require('p-queue')

const constructErrorMessage = errors => {
  // eslint-disable-next-line no-plusplus
  for (let ii = 0; ii < errors.length; ii++) {
    const error = errors[ii];
    let msg = `line ${error.line}, col ${error.col}: ${error.message}`;
    if (error.specUrl !== null) {
      msg += ` (see ${error.specUrl})`;
    }
    (error.severity === "ERROR" ? console.error : console.warn)(msg);
  }
};

const validateAmpPage = async (url, ampValidator, numberOfRetriesLeft = 2) =>
  nodeFetch(url)
    .then(res => res.text())
    .then(text => {
      const ampResult = ampValidator.validateString(text);
      if (ampResult.status !== "PASS" && numberOfRetriesLeft > 0) {
        validateAmpPage(url, ampValidator, numberOfRetriesLeft - 1);
      } else if (ampResult.status !== "PASS" && numberOfRetriesLeft === 0) {
        constructErrorMessage(ampResult.error);
        process.exit(1);
      }
    })
    .catch(error => console.error(error));

const validate = async (baseUrl, ampUrls) => {
  const ampValidator = await amphtmlValidator.getInstance();
  const queue = new PQueue({ concurrency: 3 });
  const results = ampUrls.map(page => queue.add(async () => {
    console.log("Amp validating: ", page);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result = await validateAmpPage(`${baseUrl}${page}`, ampValidator);
  }))
  return Promise.all(results)
};

module.exports = validate;