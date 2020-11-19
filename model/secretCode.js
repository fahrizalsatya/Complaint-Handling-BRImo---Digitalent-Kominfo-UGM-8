import mongoose from 'mongoose'

const secretSchema = new mongoose.Schema({
    _custId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    token: {
        type: String,
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 600,
    },
}, {
    timestamps: true,
})

const secretCode = mongoose.model('secretCode', secretSchema)
export default secretCode