"use strict";

let Router = require('express').Router;
let router = Router();


module.exports = () => {

    router.post('/example_route', (req, res) => {
        let param = req.body.param;
        res.json({param:param});
    });

    return router;
}
