const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const config = require('./index')()

module.exports = (() => {
    const app = express()
    app.set('port', process.env.PORT || 5000)
    app.set('views', path.join(__dirname, 'views'))

    // for Heroku, to process proxied IP
    // app.enable('trust proxy')

    app.use(cookieParser())
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    app.use(logger('dev'))

    // enable cross origin requests
    app.use(cors({ origin: config.security.cors.whitelist }))

    // security
    app.use(helmet.frameguard())
    app.use(helmet.hsts())
    app.use(helmet.dnsPrefetchControl())
    app.use(helmet.noSniff())
    app.use(helmet.xssFilter())

    return app
})()