const Dependency = require('../config/dependencies')

class Database {
    constructor() {
        this.mongoose = Dependency.get('mongoose')
    } 

    connect(url) {
        this.mongoose.Promise = global.Promise
        this.mongoose.connect(url)

        const { connection } = this.mongoose

        connection.on('connected', () => {
            console.log('[database] connected')
        })
        
        connection.on('error', err => {
            console.log('[database] connection error')
        })

        connection.on('disconnected', () => {
            console.log('[database] disconnected')
        })

        process.on('SIGINT', () => {
            connection.close()
            console.log('[database] disconnecting for app exit')
        })
    }
}

module.exports = Database