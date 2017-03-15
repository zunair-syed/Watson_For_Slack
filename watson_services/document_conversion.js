var DocumentConversionV1 = require('watson-developer-cloud/document-conversion/v1');
var fs = require('fs');

var document_conversion = new DocumentConversionV1({
    username: "c8fe923d-4604-44bc-9920-999b3e1476db",
    password: "N8se2AoX7hJm",
    version_date: '2015-12-01'
});

module.exports.convert = (filename) => {
    return new Promise((resolve, reject) => {
        document_conversion.convert({
          file: fs.createReadStream(filename),
          conversion_target: document_conversion.conversion_target.ANSWER_UNITS
        }, function (err, response) {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            console.log(JSON.stringify(response, null, 2));
            resolve(response);
          }
        });
    });
}
