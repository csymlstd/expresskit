const mongoose = require('mongoose')
const Schema = mongoose.Schema

const clientSchema = new Schema({
	name: { type: String },
	key: { type: String },
    allowedDomains: [String],
	status: { type: Boolean, default: true },
    settings: {
        
    },
	description: { type: String },
	organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })

const Client = mongoose.model('Client', clientSchema)
module.exports = Client
