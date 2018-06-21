const Dependency = require('../config/dependencies')
const mongoose = Dependency.get('mongoose')
const Auth = require('../services/auth')

const userSchema = new mongoose.Schema({
	name: { type: String },
	email: { type: String },
    emailConfirmed: { type: Boolean, default: false },
	password: { type: String },
	role: { type: String, default: 'user' },
	status: { type: Boolean, default: true },
	lastLogin: { type: Date },
	organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }]
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

userSchema.pre('save', async function(next) {
	let user = this
	if(user.isModified('password')) {
		password = user.password
		user.password = await Auth._createHash(password)
	}

	if(user.isModified('email')) {
      let userWithEmail = await User.findOne({ email: user.email }).exec()
      if(userWithEmail && userWithEmail._id !== user._id) return next(Logger.send('Validation error', 'That email is already in use by someone else'))
    }

	// Invalidate password reset key if there is one set.
    if(user.login_token && !user.isModified('login_token')) {
      user.login_token = undefined
    }

    // Update last login time
    user.lastLogin = new Date()

	return next()
})

const User = mongoose.model('User', userSchema)
module.exports = User
