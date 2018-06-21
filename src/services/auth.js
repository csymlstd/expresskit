const config = require('../config')
const jwt = require('jsonwebtoken')
const qs = require('qs')
const bcrypt = require('bcrypt')
const Logger = require('../services/logger')
const a = require('../services/async')
const URL = require('url')

const Client = require('../models/client')
const Session = require('../models/session')

const Auth = {
    /**
     * @summary Serialize user model to only the ID
     * @function
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    serialize: (req, res, next) => {
        if(!req.user._id) return next(Logger.send('Server error', 'User missing'))
        
        let user = { _id: req.user._id }
        if(req.user.role) user.role = req.user.role
        
        req.user = user

        return next()
    },

    /**
     * @summary Populates req.user by req.user._id
     * @async
     * @function
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */ 
    deserialize: async (req, res, next) => {
        const User = require('../models/user')
        let user = await User.findById(req.user._id).exec()
        user = user.toObject()

        req.user = user
        req.scope = [user.role]

        return next()
    },
    /**
     * @summary isScopedForMiddleware
     * @function
     * @param {Array} required - Required roles
     */
    isScopedFor: (required = []) => {
        return (req, res, next) => {
            if(typeof required == 'string') required = [required]
            if(req.scope.length > 0 && required.filter(scope => req.scope.includes(scope)).length > 0) {
                return next()
            }

            return next(Logger.send('Not authorized', 'Invalid permissions'))
        }
    },
    /**
     * @summary Middleware: Validate Client API Key
     */
    validateClient: async (req, res, next) => {
      let key = req.headers['x-api-key'] || req.query.api_key
      if(!key) return next(Logger.send('Not authorized', 'API key missing'))

      let client = await Client.findOne({ key })
      if(!client) return next(Logger.send('Not authorized', 'Invalid client'))
      req.api_client = client.toObject()
      
    //   let origin = req.get('origin')
    //   if(!origin || (client.allowedDomains.length > 0 && !client.allowedDomains.includes(origin)) && client.allowedDomains.indexOf('*') < 0) return next(Logger.send('Not authorized', 'Invalid origin'))

      req.api_key = key
      return next()
    },
    // Checks if token is valid and not expired
    isAuthenticated: (req, res, next) => {
        let token = Auth._parseAuthHeader(req.headers['authorization'])
        if(!token) return next(Logger.send('Not authorized', 'Access token missing'))

        jwt.verify(token, config.app.secret, (err, decoded) => {
            if(err && err.name == 'TokenExpiredError') {
                return next(Logger.send('Not authorized', 'Access token expired'))
            } else if(err) {
                return next(Logger.send('Not authorized', 'Access token invalid'))
            }

            // Validate session version
            if(!decoded.v || decoded.v !== config.app.sessions.version) return next(Logger.send('Not authorized', 'Access token expired'))

            req.access_token = token
            req.scope = [decoded.scope]
            req.user = { _id: decoded.user_id }

            return next()
        })
    },
    // Only checks if token was created by this server
    hasAccessToken: (req, res, next) => {
        let token = Auth._parseAuthHeader(req.headers['authorization'])
        if(!token) return next(Logger.send('Not authorized', 'Access token missing'))

        jwt.verify(token, config.app.secret, (err, decoded) => {
            // Validate session version
            if(!err && (!decoded.v || decoded.v !== config.app.sessions.version)) return next(Logger.send('Not authorized', 'Access token expired'))

            // Continue if token is only expired
            if(err && err.name == 'TokenExpiredError') return next()

            // Do not continue if token has been tampered with
            if(err) return next(Logger.send('Not authorized', 'Access token invalid'))

            return next()
        })
    },
    generateAuthorizationCode: (req, res, next) => {
        if(!req.user._id) return next(Logger.send('Validation error', 'Could not generate authorization code'))

        let expiration = config.app.sessions.authorizationDuration
        let token = {
            user_id: req.user._id,
            offline: (req.query.response_type && req.query.response_type == 'offline'),
            authorization_code: true
        }

        req.auth_code = jwt.sign(token, config.app.secret, { expiresIn: expiration })

        return next()
    },
    generateRefreshToken: async (req, res, next) => {
        if(!req.user._id) return next(Logger.send('Validation error', 'Could not generate refresh token'))

        // Must be an offline access type to receive a refresh token
        if(!req.query.access_type || req.query.access_type !== 'offline') return next()
        
        let expiration = config.app.sessions.refreshDuration
        let token = {
            v: config.app.sessions.version,
            user_id: req.user._id,
            refresh_token: true
        }

        req.refresh_token =  jwt.sign(token, config.app.secret, { expiresIn: expiration })

        // Generate session
        let new_session = new Session({ 
            refresh_token: req.refresh_token,
            user: req.user._id,
            expireAt: new Date(Date.now() + expiration * 1000)
        })
        await new_session.save()
        // Add session to request to add to access token
        req.refresh_session = new_session._id

        return next()
    },
    generateAccessToken: async (req, res, next) => {
        if(!req.user._id) return next(Logger.send('Validation error', 'Could not generate access token'))

        // Skip if authorization code response_type
        if(req.auth_code || req.query.response_type == 'code') return next()

        // Use short-lived access tokens for offline access_type
        let expiration = config.app.sessions.accessDuration

        // Use long-lived access token for online access_type
        if(!req.query.access_type || req.query.access_type == 'online') {
            expiration = config.app.sessions.accessLongDuration
        }

        let token = {
            v: config.app.sessions.version,
            user_id: req.user._id,
            scope: req.scope,
            access_token: true
        }

        // Add Refresh Session ID to allow revoking refresh from access token
        if(req.refresh_session) token.session_id = req.refresh_session

        // Generate access token
        req.access_token = jwt.sign(token, config.app.secret, { expiresIn: expiration })

        // Generate session for long-lived tokens
        if(!req.query.access_type || req.query.access_type == 'online') {
            let new_session = new Session({ 
                access_token: req.access_token,
                user: req.user._id,
                expireAt: new Date(Date.now() + expiration * 1000)
            })
            await new_session.save()
        }

        return next()
    },
    sendToken: (req, res) => {
        let output = {}

        // Add access token
        if(req.access_token) {
            if(req.user._id) output.user_id = req.user._id
            output.access_token = req.access_token
            output.expires_in = config.app.sessions.accessDuration
            output.token_type = 'Bearer'

            // Add refresh token
            if(req.refresh_token) output.refresh_token = req.refresh_token
        }

        // Add authorization code
        if(req.auth_code) {
            output.code = req.auth_code
        }

        // Do not cache this request
        res.set('Cache-Control', 'no-store')
        res.set('Pragma', 'no-cache')

        if(req.query.redirect_uri) {
            return res.redirect(`${req.query.redirect_uri}?${qs.stringify(output)}`)
        }

        return res.json(output)
    },
    sendUser: (req, res, next) => {
        if(req.user) return res.json(req.user)
        return next()
    },
    // redirectToken: (req, res, next) => {
    //     let output = {}
    //     if(!req.query.redirect_uri) return next(Logger.send('Validation error', 'Invalid redirect_uri'))

    //     // Add access token
    //     if(req.access_token) {
    //         if(req.user._id) output.user_id = req.user._id
    //         output.access_token = req.access_token
    //         output.expires_in = config.app.sessions.accessDuration
    //         output.token_type = 'Bearer'

    //         // Refresh token not sent to redirect, must use
    //         // this auth server to refresh
    //     }

    //     // Add authorization code
    //     if(req.auth_code) {
    //         output.code = req.auth_code
    //     }

    //     return res.redirect(`${req.query.redirect_uri}?${qs.stringify(output)}`)
    // },

    validateRedirectURI(req, res, next) {
        // Skip if no redirect uri
        if(!req.query.redirect_uri) return next()

        let url = new URL(req.query.redirect_uri)
        if(!url) return next(Logger.send('Validation error', 'Invalid redirect_uri'))

        // Check if redirect origin is valid
        if(config.app.cors.whitelist.indexOf(url.origin) < 0) return next(Logger.send('Validation error', 'Client does not allow redirect uri'))

        // @todo check against client if client_id present

        return next()
    },

    _getServerURL: (req) => {
        return url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: req.originalUrl
        })
    },

    _isScopedFor: (required = [], scopes = []) => {
        if(scopes.length > 0 && required.filter(scope => req.scope.indexOf(scope)) > -1) {
            return true
        }

        return false
    },

    _createHash: async (password) => {
        let salt = await bcrypt.genSalt(10)
        return bcrypt.hash(password, salt)
    },

    _verifyHash: async (password, encrypted) => {
        if(!password || !encrypted) return false

        return await bcrypt.compare(password, encrypted)
    },

    // Removes fields if user is not scoped for them
    _prepareUserUpdate: (user, scopes = []) => {
        if(!Auth._isScopedFor(['admin'], scopes)) {
            delete user.status
            delete user.role
            delete user.organizations
        }

        return user
    },

    _parseAuthHeader(header = '') {
        let token, head = header.split(' '), scheme, credentials
        if(head.length == 2) {
            scheme = head[0]
            credentials = head[1]
            if(/^Bearer$/i.test(scheme)) return credentials
        }

        return false
    }
}

module.exports = Auth