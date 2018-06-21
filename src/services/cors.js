const Logger = require('./logger')
const config = require('../config')

module.exports = {
    // Protect routes to private domains
    protect: (req, callback) => {
        return callback(null, {
            origin: (origin, callback) => {
                if(config.app.cors.whitelist.indexOf(origin) < 0 && config.app.cors.whitelist.indexOf('*') < 0) {
                    return callback(new Error('Not allowed by CORS'))
                }

                return callback(null, true)
            }
        })
    },
    // Protect routes, and only allow clients allowed domains
    allowClient: (req, callback) => {
        return callback(null, {
            origin: (origin, callback) => {
                let allowed = [...req.api_client.allowedDomains,...config.app.cors.whitelist] || [...config.app.cors.whitelist]
                if(allowed.indexOf(origin) < 0 && allowed.indexOf('*') < 0) {
                    return callback(new Error('Domain is not listed in allowed domains for this client'))
                }

                return callback(null, true)
            }
        })
    }
}