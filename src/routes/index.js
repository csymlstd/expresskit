const Dependency = require('../services/dependency')
const router = Dependency.get('router')

module.exports = () => {

    router.use('/auth', require('./auth'))
    
    router.get('/', (req, res, next) => {
        return res.send('Welcome')
    })

    return router
}