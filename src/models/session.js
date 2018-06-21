const Dependency = require('../config/dependencies')
const mongoose = Dependency.get('mongoose')
const Auth = require('../services/auth')

const config = require('../config')()

const sessionSchema = new mongoose.Schema({
    v: { type: Number, default: config.app.sessions.version },
	refresh_token: { type: String, index: true }, // for offline access type
    client_id: { type: String }, // to validate client
    agent: { // to validate session
        browser: String,
        os: String,
        device: String,
        ip: { type: String },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expireAt: { type: Date },
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

sessionSchema.index({ "expireAt": 1 }, { expireAfterSeconds: 0 })

const Session = mongoose.model('Session', sessionSchema)
module.exports = Session
