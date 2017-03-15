var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var fs = require('fs');

var visual_recognition = new VisualRecognitionV3({
  api_key: 'b6b485f6da104429d6f7c515a29cdf43729212cb',
  version_date: '2016-05-19'
});

module.exports.recognizeText = (params) => {
    return new Promise((resolve, reject) => {
        visual_recognition.recognizeText(params, (err, res) => {
            if(err){reject(err)}
            else{resolve(res)}
        });
    });
}

module.exports.classify = (params) => {
    return new Promise((resolve, reject) => {
        visual_recognition.classify(params, (err, res) => {
            if(err){reject(err)}
            else{resolve(res)}
        });
    });
}

module.exports.detectFaces = (params) => {
    return new Promise((resolve, reject) => {
        visual_recognition.detectFaces(params, (err, res) => {
            if(err){reject(err)}
            else{resolve(res)}
        });
    });
}
