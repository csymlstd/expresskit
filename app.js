const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')

const app = express()
app.set('port', process.env.PORT || 5000)
app.set('views', path.join(__dirname, 'views'))

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(logger('dev'))

app.use(express.static(path.join(__dirname, 'public')))

// Initialize Routes
app.use('/', require('./routes')())
