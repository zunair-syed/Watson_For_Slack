"use strict";

let botkit = require('botkit');
let config = require('../util/config.js');
const sharedPublicUrl = "https://slack.com/api/files.sharedPublicURL";
var request = require('request');
var util = require('../util/util');

const FILE_DOCUMENT = ["docx", "doc", "pdf", "html"]
const FILE_IMG = ["jpg", "png", "gif", "bmp", "jpeg"];

module.exports = class SlackBot {
    constructor(watson) {
        console.log("slack_bot_access_token: " + config.slack_bot_access_token );
        this.controller = botkit.slackbot({
            debug: false,
            stats_optout: true
        });
        this.bot = this.controller.spawn({
            token: config.slack_bot_access_token
        });

        this.watson = watson;
    }

    initializeClient(cb) {
        this.bot.startRTM((err, bot, payload) => {
            if (err) {
                console.log(err);
                cb(false);
            }
        });

        this.controller.on('rtm_open', (bot) => {
            console.log('Slack bot rtm_open');
            this.user_id = bot.identity.id;
        });

        this.controller.on('rtm_close', (bot) => {
            console.log('Slack bot rtm_close');
            this.bot.startRTM();
        });

        this.controller.on('direct_message', (bot,message) => {
            console.log('Slack bot direct_message');
            this.watson.direct_message(message);
        });

        this.controller.on('direct_mention', (bot, message) => {
            console.log('Slack bot direct_mention');
            this.watson.direct_mention(message);
        });

        this.controller.on('file_shared', (bot, message) =>  {
            console.log('Slack bot file_shared');
            request.post({url:sharedPublicUrl, form: {file:message.file_id, token:config.slack_access_token}}, (err,httpResponse,body) => {
                body = util.isJson(body) ? JSON.parse(body) : null ;

                console.log("body: " + JSON.stringify(body, null, 4));
                if(!err && body && body.file.filetype){
                    this.saveFileToFolder(body)
                        .then((filename) => {
                            if(FILE_IMG.indexOf(body.file.filetype) > -1){
                                console.log("image file");
                                this.watson.image_analysis(message, filename, body);
                            }else if(FILE_DOCUMENT.indexOf(body.file.filetype) > -1){
                                console.log("document file");
                                this.watson.document_analysis(message, filename, body);
                            }else{
                                console.log("file type " + body.file.filetype + " not supported");
                            }
                        })
                }
                else{
                    console.log("missing permalink public : " + err);
                }
            })
        })
        return true;
    }

    say(text, channel){
        this.bot.say({
            text,
            channel
        });
    }

    say(text, channel, attachment){
        this.bot.say({
            text,
            channel,
            attachments:attachment
        });
    }

    saveFileToFolder(body){
        return new Promise((resolve, reject) => {
            var headers = {'Authorization':"Bearer " + config.slack_bot_access_token}
            var file_title = (body.file.name) ? body.file.name : "no_name";
            file_title = file_title.replace(/ /g, "-")
            var file_name =  __dirname + "/slack_downloads/" + body.file.id + "_" + file_title ;
            console.log("file name would be: " + file_name);
            util.getAndSaveFile(body.file.url_private, headers, file_name, () => {
                console.log("after callback 11");
                resolve(file_name);
            })
        })
    }

    getAllUserFullNames(){
        console.log("got hre1")
        return new Promise((resolve, reject) => {
            this.bot.api.users.list({
            }, (err, res) => {
                console.log("err" + JSON.stringify(err));
                console.log("res" + JSON.stringify(res, null, 4));
                if(err){reject(err)}
                else{resolve(res)}
            });
        })
    }

}
