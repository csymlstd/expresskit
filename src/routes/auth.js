const Dependency = require('../config/dependencies')
const router = Dependency.get('router')
const config = require('../config')
const Auth = require('../services/auth')

const Logger = require('../services/logger')
const HTML = require('../services/html')
const Mail = require('../services/mail')
const a = require('../services/async')

const jwt = require('jsonwebtoken')

const User = require('../models/user')
const Session = require('../models/session')

module.exports = () => {

    // Login with Email and Password
    // Returns Tokens or Redirects
    router.post('/', a(async (req, res, next) => {
        let email = req.body.email.toLowerCase()
        let password = req.body.password

        let user = await User.findOne({ email }).exec()
        if (!user){
            return next(Logger.send('Validation error', 'Invalid email or password'))
        }

        // If there is no password set, usually when logging in with oauth
        if(!user.password) {
            return next(Logger.send('Validation error', 'You registered using a social account'))
        }

        // User exists but wrong password, log the error
        if (!await Auth._verifyHash(password, user.password)){
            return next(Logger.send('Validation error', 'Invalid email or password'))
        }

        await user.save()

        // User has logged in successfully.
        req.user = user
        return next()

        switch(req.query.response_type) {
            case 'token':
                // Generate Refresh Token
                return (req, res, next) => {
                    a(Auth.generateRefreshToken(req, res, () => {
                        next()
                    }))
                }
                break
            default:
            case 'code':
                // Generate Authorization Code
                return (req, res, next) => {
                    a(Auth.generateAuthorizationCode(req, res, () => {
                        next()
                    }))
                }
                break
        }

    }), a(Auth.generateAccessToken), Auth.sendToken)

    // Request a login_token sent to email
    // return JSON
    router.post('/magic-link', a(async (req, res, next) => {
        // Delay response to prevent a time leak of an email's existance
        if(!req.body.email) return setTimeout(() => { next() }, 600)

        let user = await User.findOne({ email: req.body.email })
        if(!user) return next()

        let token = jwt.sign({ user_id: user._id, login_token: true }, config.app.secret, { expiresIn: (60 * 60) })

        let mail = {
            from: config.email.from,
            to: user.email,
            subject: 'One-Time Login Link',
            html: await HTML.getTemplate('emails/magic-link.ejs', { url: `${config.app.url}`, token }, req.app)
        }

        Mail.send(mail)
        return next()

    }), (req, res, next) => {
        return res.json({ message: 'Check your email for a one-time login link.' })
    })

    // Register with Email and Password
    // Generates email_token sent to email to confirm address
    // returns JSON
    router.post('/register', a(async (req, res, next) => {
        let email = req.body.email.toLowerCase()
        let password = req.body.password
        let name = req.body.name

        let existingUser = await User.findOne({ email }).exec()
        if(existingUser) return next(Logger.send('Validation error', 'That email is already in use'))

        let user = new User({
            email,
            password,
            name
        })

        await user.save()
        req.user = user

        // Generate email token
        let token = jwt.sign({ user_id: user._id, email_token: true }, config.app.secret, { expiresIn: config.app.sessions.refreshDuration })
        let mail = {
            from: config.email.from,
            to: user.email,
            subject: 'Confirm your email address',
            html: await HTML.getTemplate('emails/confirm-email.ejs', { url: `${config.app.url}${config.app.paths.confirmEmail}`, token }, req.app)
        }

        Mail.send(mail)
        
        return res.json({ message: 'Check your email to confirm your email address. '})
    }))

    // Retrieve an access token based on grant type
    router.post('/token', a(async (req, res, next) => {
        // @todo would require a client id here
        switch(req.body.grant_type) {

            // Requesting a refresh and access token from a one time login link or auth code
            case 'authorization_code':
                if(!req.body.code) return next(Logger.send('Validation error', 'Authorization code missing'))

                // Check if login token is valid
                jwt.verify(req.body.code, config.app.secret, (err, decoded) => {
                    if(err || !decoded.authorization_code) return next(Logger.send('Not authorized'))

                    req.user = { _id: decoded.user_id }

                    // Generate Authorization Code
                    return (req, res, next) => {
                        
                        // Whether to generate a short-lived access token with refresh token
                        // or long-lived access token
                        if(decoded.offline) {
                            req.query.access_type = 'offline'
                        } else {
                            req.query.access_type = 'online'
                        }

                        a(Auth.generateRefreshToken(req, res, () => {
                            next()
                        }))
                    }

                })
                break

            // Requesting an access token from a refresh token
            case 'refresh_token':
                if(!req.body.refresh_token) return next(Logger.send('Validation error', 'Refresh token missing'))

                // Check if refresh token is expired
                jwt.verify(req.body.refresh_token, config.app.secret, async (err, decoded) => {
                    if(err || !decoded.refresh_token) return next(Logger.send('Not authorized', 'Your session has expired, please login again.'))
                    
                    // Check if token has been revoked
                    let token_exists = await Session.findOne({ refresh_token: req.body.refresh_token }).exec()
                    if(!token_exists) return next(Logger.send('Not authorized', 'Your session has expired, please login again.'))

                    // @todo check if user agent and ip match

                    req.user = { _id: decoded.user_id }

                    // Generate access token
                    req.query
                    return next()
                })
                break

            // Requesting an access token from a magic link (login token)
            case 'login_token':
                if(!req.body.login_token) return next(Logger.send('Validation error', 'Login token missing'))

                // Check if login token is valid
                jwt.verify(req.body.login_token, config.app.secret, (err, decoded) => {
                    if(err || !decoded.login_token) return next(Logger.send('Not authorized'))

                    req.user = { _id: decoded.user_id }

                    // Generate long-lived access token
                    return next()

                })
                break
            
            // Confirm user's email address and returns access token
            case 'email_token':
                if(!req.body.email_token) return next(Logger.send('Validation error', 'Email token missing'))

                // Check if email token is valid
                jwt.verify(req.body.email_token, config.app.secret, async (err, decoded) => {
                    if(err || !decoded.email_token) return next(Logger.send('Not authorized'))                   

                    req.user = { _id: decoded.user_id }
                    // Set user as confirmed
                    await User.findByIdAndUpdate(decoded.user_id, { $set: { emailConfirmed: true }}).exec()

                    // Generate long-lived access token
                    return next()

                })
                break
            default:
                return next(Logger.send('Not authorized', 'Invalid grant_type'))
                break
        }
    }), a(Auth.deserialize), a(Auth.generateAccessToken), Auth.sendToken)

    // Revoke a refresh token
    router.get('/revoke', a(async (req, res, next) => {
        if(!req.query.token) return next(Logger.send('Bad request', 'token missing'))

        jwt.verify(req.query.token, config.app.secret, async (err, decoded) => {
            if(err && err.name !== 'TokenExpiredError') return next(Logger.send('Bad request', 'Invalid token'))
            
            // revoke from a refresh token
            let query = { refresh_token: req.query.token }
            
            // revoke from a short-lived access token
            if(decoded.access_token && decoded.session_id) {
                query = { _id: decoded.session_id }
            } 

            // revoke from a long-lived access token
            if(decoded.access_token && !decoded.session_id) {
                query = { access_token: req.query.token }
            } 

            // Remove refresh token
            let token = await Session.findOne(query).exec()
            if(token) await token.remove()

            return res.json({})
        })
    }))

    // Verify password
    router.post('/verify-password', Auth.isAuthenticated, a(Auth.deserialize), a(async (req, res, next) => {
        let password = req.body.password

        if(!await Auth._verifyHash(password, req.user.password)) {
            return next(Logger.send('Validation error', 'Verification failed'))
        }

        return res.json({})
    }))

    // Get user profile
    router.get('/profile', Auth.isAuthenticated, a(async (req, res, next) => {
        let user = await User.findById(req.user._id).select('-password -reset').populate({
            path: 'organizations',
            select: 'name'
        })
        delete user.password
        return res.json(user)
    }))

    return router
}
