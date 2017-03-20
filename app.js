var bodyParser = require('body-parser')
var express = require('express');
var port = process.env.PORT || process.env.VCAP_APP_PORT || 8000;
const PUBLIC_DIR = process.cwd() + '/public';
var adminModule = require('./api/admin.js');
var registerModule = require('./api/register.js');
var watson = require('./watson')

// var video = require('./util/video');
// video.addSubtitles("", () => {});
// video.extractAudio();
// var speech_to_text = require('./watson_services/speech_to_text')


var app = express();
watson = new watson();

var jsonParser = bodyParser.json()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

//expose public directory
app.use(express.static(PUBLIC_DIR));

//Define modules which will be routes to a sub-endpoint
app.use('/api', adminModule());
app.use('/api', registerModule());

app.listen(port, function() {
  console.log('Server running on port: %d', port);
});
