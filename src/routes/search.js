const Dependency = require('../config/dependencies')
const router = Dependency.get('router')

const Search = require('../services/search')
const Logger = require('../services/logger')
const Auth = require('../services/auth')

module.exports = () => {

    // Point index alias to provided index
    router.post('/index/activate', Auth.isAuthenticated, Auth.isScopedFor(['admin']), a(async (req, res, next) => {
        let index = req.body.index
        let exists = await Search.indexExists(index)
        if(!exists) return next(Logger.send('Not found', 'Index does not exist'))

        let currentIndex = await Search.getActiveIndex()

        let response = await Search.indexSwitch(index)
        return res.json(response)
    }))

    // Create an index
    router.post('/index/create', Auth.isAuthenticated, Auth.isScopedFor(['admin']), a(async (req, res, next) => {
        let index = req.body.index
        let exists = await Search.indexExists(index)
        if(exists) return next(Logger.send('Validation error', 'Index already exists'))

        let response = await Search.indexCreate(index)
        return res.json(response)
    }))

    // Delete an index
    router.post('/index/delete', Auth.isAuthenticated, Auth.isScopedFor(['admin']), a(async (req, res, next) => {
        let index = req.body.index
        let exists = await Search.indexExists(index)
        if(!exists) return next(Logger.send('Not found', 'Index does not exist'))

        let response = await Search.indexDelete(index)
        return res.json(response)
    }))

    // Index a document
    router.post('/index', Auth.isAuthenticated, Auth.isScopedFor(['admin']), a(async (req, res, next) => {
        let type = req.body.type
        let id = req.body.id
        let name = req.body.name

        let response = await Search.index({
            type,
            id,
            body: {
                name
            }
        })

        return res.json(response)
    }))

    // Get status of index
    router.get('/status', Auth.isAuthenticated, Auth.isScopedFor(['admin']), a(async (req, res, next) => {
        let status = await Search.status()
        return res.json(status)
    }))

    // Query index by terms
    router.get('/', a(async (req, res, next) => {
        let types = req.query.types.split(',')

        let query = await Search.query(req.query.q, types)
        return res.json(response)
    }))

    return router
}