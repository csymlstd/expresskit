const Dependency = require('../config/dependencies')
const config = require('../config')()
const router = Dependency.get('router')

module.exports = () => {

    router.use('/auth', require('./auth'))
    if(config.search.url) router.use('/search', require('./search'))
    
    router.get('/', (req, res, next) => {
        return res.send('Welcome')
    })

    return router
}