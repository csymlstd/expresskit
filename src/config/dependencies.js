const Dependency = require('../services/dependency')

Dependency.register('mongoose', () => {
    return require('mongoose')
})

Dependency.register('router', () => {
    return require('express').Router()
})

Dependency.register('request', () => {
    return require('axios')
})

Dependency.register('uuid', () => {
    return require('uuid/v4')
})

Dependency.register('mailer', () => {
    return require('nodemailer')
})

Dependency.register('mailer-mailgun', () => {
    return require('nodemailer-mailgun-transport')
})

Dependency.register('elasticsearch', () => {
    return require('elasticsearch')
})


// Dependency.register('', () => {
//     return
// })

module.exports = Dependency