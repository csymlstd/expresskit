const Dependency = require('../config/dependencies')
const config = require('../config')()
const mailer = Dependency.get('mailer')
const mailgun = Dependency.get('mailer-mailgun')


let Mail
if(config.email.transport == 'mailgun') {
    Mail = mailer.createTransport(mailgun({
        auth: {
            api_key: config.email.mailgun.key,
            domain: config.email.mailgun.domain
        },
        proxy: false
    }))
} else if(config.email.transport == 'smtp') {
    Mail = mailer.createTransport({
        port: config.email.smtp.port,
        host: config.email.smtp.host,
        auth: {
            user: config.email.smtp.user,
            pass: config.email.smtp.pass
        },
        secure: config.email.smtp.secure,
        pool: config.email.smtp.pool
    })
}

module.exports = {
    send: (opts = {}) => {
        return new Promise((resolve, reject) => {
            let defaults = {
                from: config.email.from,
            }

            let options = Object.assign({}, defaults, opts)
            Mail.sendMail(options, (err, body) => {
                if(err) return reject(err)
                return resolve(body)
            })
        })
    }
}