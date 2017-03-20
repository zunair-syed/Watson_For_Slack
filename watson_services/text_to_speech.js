var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var fs = require('fs');
const uuidV4 = require('uuid/v4');

var text_to_speech = new TextToSpeechV1({
    "username": "cfac6c58-cf44-4a2a-9d36-d0a03067503a",
    "password": "xXt3yHOMb1Oq"
});

var params = {
  text: ' ',
  voice: 'en-US_MichaelVoice', // Optional voice
  accept: 'audio/wav'
};

module.exports.convert = (text) => {
    return new Promise((resolve, reject) => {
        params.text = text;
        var path = __dirname.split("/watson_services")[0] + "/public/slack_uploads"
        var filename = "audio_" + uuidV4() + ".wav";
        var fullpath = path + "/" + filename;
        console.log('fullpath: ' + fullpath);
        var writeStream = fs.createWriteStream(fullpath);
        writeStream.on('close', function() {
          console.log('file written');
          resolve(fullpath);
        });
        text_to_speech.synthesize(params).pipe(writeStream);
    });
}
// Pipe the synthesized text to a file
