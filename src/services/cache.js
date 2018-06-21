const Dependency = require('../config/dependencies')
const config = require('../config')()


class Cache {
    constructor(key, ignore = config.cache.ignore, expiration = config.cache.expiration) {
        this.key = `${config.cache.prefix}:${key}`
        this.expiration = expiration
        this.ignoreCache = ignore
        this.client = Dependency.get('redis-client')
    }

    connect(url) {
        const redis = require('redis')
        const client = Dependency.register('redis-client', redis.createClient({
            url,
            retry_strategy: options => {
                if(options.attempt > 2) {
                    console.log('[cache] connection failed')
                    return undefined
                }

                console.log('[cache] retrying connection')
                return 1000 * 2
            }
        }))

        client.on('ready', () => {
            console.log('[cache] connected')

            process.on('SIGINT', () => {
                console.log('[cache] closing connection')
                client.end(true)
            })
        })

        client.on('error', err => {
            console.log('[cache] connection error')
        })
    }

    cache(data, exp = this.expiration) {
        return new Promise((resolve, reject) => {
            if(!data) return resolve(null)
            if(config.app.logging) console.log(`[cache] caching ${this.key}`)

            if(exp == '*') {
                this.client.set(this.key, JSON.stringify(data))
            } else {
                this.client.setex(this.key, exp, JSON.stringify(data))
            }
            
            return resolve(data)
        })
        
    }

    async get(query = false) {
        let getCache = new Promise((resolve, reject) => {
            if(this.ignoreCache === true) return resolve(null)
            this.client.get(this.key, (err, data) => {
                if(err) return resolve(null)
                return resolve(JSON.parse(data))
            })
        })

        // Get data from cache
        let data = await getCache
        if(data !== null) {
            return data
        }

        // Data not cached, now querying if provided
        if(query) {
            if(config.app.logging) console.log(`[cache] querying ${this.key}`)
            data = (typeof query == 'function') ? await query.call(this) : await query

            this.cache(data)
        }
        
        return data
    }

    purge() {
        return new Promise((resolve, reject) => {
            if(config.app.logging) console.log(`[cache] purging ${this.key}`)
            this.client.del(this.key, (err, response) => {
                return resolve(response)
            })
        })
    }

    static purgeAll() {
        return new Promise((resolve, reject) => {
            this.client.flushdb((err, response) => {
                return resolve(response)
            })
        })
    }
}

module.exports = Cache