// Initialize Dependencies
const Dependency = require('./src/config/dependencies') 
const config = require('./src/config')()

const express = require('express')
const path = require('path')

// Initialize Database
const Database = require('./src/services/database')
if(config.db.url) new Database().connect(config.db.url)

// Initialize Cache
const Cache = require('./src/services/cache')
if(config.cache.url) new Cache().connect(config.cache.url)

// Initialize Express app
const app = require('./src/config/express')

// Initialize Routes
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path, stat) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET')
        res.header('Access-Control-Allow-Headers', 'Content-Type')
        res.header('Vary', 'Accept-Encoding')
    }
}))
app.use('/', require('./src/routes')())

// Page not found handler
app.use((req, res, next) => {
    return res.status(404).send('Not Found')
})

if(app.get('env') == 'production') {
    app.use((err, req, res, next) => {
        return res.status(500).send('Server Error')
    })
}

app.listen(config.app.port, () => {
    console.log(`[server] Now online at http://localhost:${config.app.port}`)
})
