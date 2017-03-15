"use strict";

let Router = require('express').Router;
let router = Router();
let util = require('../util/util')
let config = require('../util/config')

//https://slack.com/oauth/authorize?client_id=149116710928.149877315348&scope=bot+files%3Awrite%3Auser
module.exports = () => {

    router.get('/register', (req, res) => {
        console.log("in register route");
        const code = req.query.code;
        let url = 'https://slack.com/api/oauth.access?client_id=' + config.slack_clientID +
        '&client_secret=' +  config.slack_clientSecret + '&code=' + code;

        util.getAPI(url, (parsedData) => {
            console.log("parsedData: " + JSON.stringify(parsedData));
            res.json("successfully added watson");
        });
    });

    return router;
}
