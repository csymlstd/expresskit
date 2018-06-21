const Dependency = require('../config/dependencies')
const mongoose = Dependency.get('mongoose')

const organizationSchema = new mongoose.Schema({
	name: { type: String },
	status: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

const Organization = mongoose.model('Organization', organizationSchema)
module.exports = Organization
