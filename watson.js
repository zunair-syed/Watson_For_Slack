"use strict";

let Bot = require('./slack/slack.js');
var watsonVisual = require('./watson_services/visual_recognition.js');
var watsonDocument = require('./watson_services/document_conversion.js');
var watsonTranslate = require('./watson_services/language_translator.js');
var watsonToSpeech = require('./watson_services/text_to_speech.js');
var watsonToText = require('./watson_services/speech_to_text.js');

var fs = require('fs');
var util = require('./util/util')
var config = require('./util/config')
var request = require('request');
var Canvas = require('canvas');
var face_detect_attach = require("./slack/attachments/face_detect.json");
var video = require('./util/video.js')

const SERVER_URL = "https://77aa0ceb.ngrok.io/"
const ACTION_TRANSLATE_PREV_MSG = "TRANSLATE_PREV_MSG";
const ACTION_TO_SPEECH = "TO_SPEECH";

module.exports = class Watson {
    constructor() {
        console.log("watson bot being init");
        this.slackbot = new Bot(this);
        this.slackbot.initializeClient((cb) => {console.log(cb)})
        // this.addSpeechAnalysis("");
        // this.slackbot.uploadVideo("/Users/zunairsyed/Documents/Waterloo_CE/Side_Projects/watson_slack/watson_for_slack/slack/slack_downloads/obama.srt", "G4D4UTNBB")
    }

    direct_message(message){
        console.log("message was " + JSON.stringify(message));

    }

    direct_mention(message){
        console.log("message was " + JSON.stringify(message));
        // var f = "/Users/zunairsyed/Documents/Waterloo_CE/Side_Projects/watson_slack/watson_for_slack/public/slack_uploads/F4LBD5M5Z_obama.mp4"
        // this.slackbot.uploadFile(message, f);

        var intention = this.getIntentionOfMsg(message);
        switch (intention) {
            case ACTION_TRANSLATE_PREV_MSG:
                this.translatePrevMessage(message);
                break;
            case ACTION_TO_SPEECH:
                this.toSpeechPrevMessage(message);
                break;
            default:
                console.log("default case")
                break;
        }
    }

    image_analysis(message, filename, source){
        console.log("message was " + JSON.stringify(message));
        console.log("file was " + JSON.stringify(source, null, 4));

        if(source.file.size > 2097150){
            console.log("image was too big");
            return;
        }

        watsonVisual.classify({url:source.file.permalink_public})
            .then((res) => {
                console.log("From Classify API: " + JSON.stringify(res, null, 4));

                var classes = res.images[0].classifiers[0].classes;
                var classMessage = "";
                classes = classes.sort(function(a, b) {
                  return a.score - b.score ;
                });
                classes = classes.reverse();
                classes.forEach((obj, i) => {
                    obj.score = parseInt(obj.score*100) + "% ";
                    if(i <= classes.length - 3) {classMessage += "*" + obj.class + "* _(" + obj.score + ")_, "}
                    else if(i == classes.length - 2) {classMessage += "*" + obj.class + "* _(" +obj.score + ")_ And "}
                    else {classMessage += "*" + obj.class + "* " + "_(" +obj.score + ")_"}
                })

                this.slackbot.say("I think this picture is about " + classMessage, source.file.groups[0] )
                return Promise.resolve()
            }, (err) => {
                console.log("err was " + err)
            })

        watsonVisual.detectFaces({url:source.file.permalink_public})
            .then((res2) => {
                console.log("From Detect Faces API: " + JSON.stringify(res2, null, 4));
                if(!res2.images[0].faces || res2.images[0].faces.length == 0){
                    console.log("no face detected");
                    return;
                }
                var faces = res2.images[0].faces;
                var ageString = "";
                var genderString = "";
                var identityString = "";

                if(faces.length == 1){
                    if(faces[0].age && (faces[0].age.min || faces[0].age.max) && faces[0].age.score > 0.40){
                        if(faces[0].age.min && faces[0].age.max ){ageString = "Looks like this person is around " + faces[0].age.min + " to " + faces[0].age.max}
                        else if(faces[0].age.min && !faces[0].age.max ){ageString = "Looks like this person older than " + faces[0].age.min}
                        else if(!faces[0].age.min && faces[0].age.max ){ageString = "Looks like this person younger than " + faces[0].age.max}
                        ageString += "."
                    }

                    if(faces[0].gender && faces[0].gender.score > 0.75 && faces[0].gender.gender){
                        genderString = " This person is a " + faces[0].gender.gender.toLowerCase() + ".";
                    }

                    if(faces[0].identity &&  faces[0].identity.score > 0.4 && faces[0].identity.name){
                        identityString = "\n Oh I know, this is *" + faces[0].identity.name + "*.";
                    }
                }else if(faces.length > 1){
                    var saidMale = false;
                    var saidFemale = false;
                    var ageGroups = []

                    faces.forEach((face) => {

                        if(face.age && (face.age.min || face.age.max) && face.age.score > 0.30){
                            if(!face.age.min){face.age.min = "middle-age"}
                            if(!face.age.max){face.age.max = "middle-age"}
                            if(!(ageGroups.indexOf(face.age.min + " to " + face.age.max) >= 0)){
                                ageGroups.push(face.age.min + " to " + face.age.max);
                                if(ageString == "")
                                    ageString = "Looks like there are people in age groups *" + face.age.min + " to " + face.age.max + "*"
                                else
                                    ageString += " and *"  + face.age.min + " to " + face.age.max + "*"
                            }
                        }

                        if(face.gender && face.gender.score > 0.75 && face.gender.gender){
                            if(genderString == "")
                                genderString = "\n There seems to be " + face.gender.gender.toLowerCase()
                            else if((face.gender.gender.toLowerCase() == "male") && !saidMale)
                                genderString += " and male"
                            else if((face.gender.gender.toLowerCase() == "female") && !saidFemale)
                                genderString += " and female"
                            if(face.gender.gender.toLowerCase() == "male"){saidMale = true}
                            if(face.gender.gender.toLowerCase() == "female"){saidFemale = true}
                        }

                        if(face.identity && face.identity.score > 0.4 && face.identity.name){
                            if(identityString == "")
                                identityString = "\n There is *" + face.identity.name + "* ";
                            else
                                identityString += " and *" + face.identity.name + "*.";
                        }
                    })
                }
                this.slackbot.say(ageString + genderString + identityString + ". ", source.file.groups[0] )

                var trueFileName = filename.split("/")[filename.split("/").length - 1].split(".")[0]
                var allFaces = [];
                faces.forEach((face) => {
                    if(face.face_location) {allFaces.push(face.face_location)}
                })
                return this.createFaceRectangles(filename, trueFileName, allFaces)
            }, (err2) => {
                console.log("err2 was " + err2)
            })
            .then((img_url) => {
                console.log(SERVER_URL+img_url)
                var attachmentJSON = face_detect_attach;
                attachmentJSON[0].image_url = SERVER_URL+img_url;
                this.slackbot.say("", source.file.groups[0], attachmentJSON )
            })
    }

    document_analysis(message, filename, source){
        var allText = ""
        watsonDocument.convert(filename)
            .then((response) => {
                response.answer_units.forEach((obj) =>{
                    allText += obj.content[0].text;
                })
                allText = allText.toLowerCase();
                return this.slackbot.getAllUserFullNames();
            })
            .then((res) => {
                console.log("res user fill names : " + JSON.stringify(res, null, 4));
                var usrMentionArr = [];
                res.members.forEach((member) => {
                    if(member.name && allText.includes(member.name)) {usrMentionArr.push(member.id);}
                    if(member.real_name && allText.includes(member.real_name)) {usrMentionArr.push(member.id);}
                    if(member.profile.first_name && allText.includes(member.first_name)) {usrMentionArr.push(member.id);}
                    if(member.profile.real_name && allText.includes(member.real_name)) {usrMentionArr.push(member.id);}
                    if(member.profile.last_name && allText.includes(member.last_name)) {usrMentionArr.push(member.id);}
                })
                var uniqUsrArr = Array.from(new Set(usrMentionArr));
                var mentionStr = "";
                uniqUsrArr.forEach((usr) => {
                    mentionStr += "*<@" + usr + ">*, "
                })

                this.slackbot.say("Hey " + mentionStr + " You might wanna check this out", source.file.groups[0] )

            })
    }


    createFaceRectangles(src, name, faces){
        return new Promise((resolve, reject) => {
            var Image = Canvas.Image
            var img = new Image()
            img.src = src;
            console.log("img.src: " + img.src);
            var canvas = new Canvas(img.width, img.height, 'png')
            var ctx = canvas.getContext('2d')

            ctx.drawImage(img, 0, 0)
            ctx.strokeStyle = 'rgba(255,0,0,2)';
            faces.forEach((face) => {
                ctx.strokeRect(face.left, face.top, face.width, face.height)
            })

            var writeFilePath = __dirname + '/public/slack_uploads/' + name + '.png'
            console.log("writeFilePath: " + writeFilePath);
            fs.writeFile(writeFilePath, canvas.toBuffer(), function (err) {
                if (err) throw err
                console.log('created out.pdf')
                resolve('slack_uploads/'+name + '.png')
            })
        })
    }


    translatePrevMessage(message){
        var lastMsg = null;
        this.slackbot.getlastMSG(message)
            .then((msg) => {
                lastMsg = msg;
                console.log(JSON.stringify(msg))
                return watsonTranslate.identify(msg.text);
            }, (err) => {
                console.log("err in translating prev message: " + err);
            })
            .then((language_res) => {
                console.log("langaue res:" + JSON.stringify(language_res));
                if(!language_res || !language_res.languages || language_res.languages.length == 0){
                    console.log("err no lanauges response api");
                    return;
                }

                var source = language_res.languages[0].language;
                if(source == "en"){
                    console.log("cannot convert from english to english")
                    this.slackbot.say("I'm sorry, but <@"+lastMsg.user+"> wrote that in english already", message.channel )
                    return;
                }else{
                    return watsonTranslate.translate(lastMsg.text, source, "en");
                }

            }, (err) => {
                console.log("err in api call identify lang");
            })
            .then((trans_res) => {
                console.log("trans_res res:" + JSON.stringify(trans_res));
                if(!trans_res || !trans_res.translations || trans_res.translations.length == 0){
                    console.log("err no translation response api");
                    return;
                }
                var translation = trans_res.translations[0].translation;
                this.slackbot.say("<@"+lastMsg.user+"> said _'" + translation + "'_", message.channel )
            }, (err) => {
                console.log("err in translating: " + err)
            })
    }

    toSpeechPrevMessage(message){
        var lastMsg = null;
        this.slackbot.getlastMSG(message)
            .then((msg) => {
                lastMsg = msg;
                console.log(JSON.stringify(msg))
                return watsonToSpeech.convert(msg.text);
            }, (err) => {
                console.log("err in geting last message");
            })
            .then((fullpath) => {
                console.log("fullpath: " + fullpath)
                return this.slackbot.uploadFile(message, fullpath);
            }, (err) => {
                console.log("err in translating prev message: " + err);
            })
    }


    getIntentionOfMsg(message){
        if(message.text.includes("translate")){
            return ACTION_TRANSLATE_PREV_MSG;
        }else if(message.text.includes("to speech")){
            return ACTION_TO_SPEECH;
        }
    }


    addSpeechAnalysis(message, file_name, source){
        //1) Download the slack video to slack/slack_downloads
        //2) Extract the wav file from the video, save in slack/slack_downloads
        //3) Send wav file to watson, Parse response
        //4) Convert response to srt, save srt in public/slack_uploads
        //5) Attach srt to video
        //6) post video onto slack

        var name = (file_name.split("/")[file_name.split("/").length - 1]).split(".")[file_name.split(".").length - 2];
        var extension = "."+file_name.split(".")[file_name.split(".").length - 1];
        var pathToVid = file_name.split(name)[0]

        console.log("pathToVid: " + pathToVid);
        console.log("name: " + name);
        console.log("extension: " + extension);

        video.extractAudio(pathToVid, name, extension)
            .then(() => {
                console.log("extracted audio");
                this.slackbot.say("_Proccessing *10%* Done_", source.file.groups[0])
                return watsonToText.getSpeechText(pathToVid, name);
            }, (err) => {
                console.log("err in extracting audio: " + err)
            })
            .then((json) => {
                console.log("getSpeechText done");
                console.log("json :" + JSON.stringify(json, null, 4));
                this.slackbot.say("_Proccessing *65%* Done_", source.file.groups[0])

                return watsonToText.toSRTFormat(json);
            }, (text_err) => {
                console.log("err in watson speech: " + text_err);
            })
            .then((srtString) => {
                console.log("toSRTFormat done");
                console.log("srtString :" + srtString);

                return watsonToText.saveSRTFile(pathToVid, name, srtString);
            }, (srtFortmatErr) => {
                console.log("err in srtFormatting: " + srtFortmatErr)
            })
            .then(() => {
                console.log("saveSRTFile done");
                var writePath = __dirname + "/public/slack_uploads/"
                return video.attachSrt(pathToVid, name, extension, writePath)
            }, (saveSRTErr) => {
                console.log("err in savingSRT: " + saveSRTErr)
            })
            .then((fullpath) => {
                console.log("fullpath: " + fullpath);
                this.slackbot.say("_Proccessing *90%* Done _", source.file.groups[0])

                // setTimeout( () => {
                    this.slackbot.uploadVideo(fullpath, source.file.groups[0]);
                // }, 5000);
            }, (attachSrtErr) => {
                console.log("err in attachSrtErr: " + attachSrtErr)
            })


    }


}
