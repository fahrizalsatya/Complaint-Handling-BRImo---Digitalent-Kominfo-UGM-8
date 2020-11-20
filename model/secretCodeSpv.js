import mongoose from 'mongoose'

const secretSchema = new mongoose.Schema({
    _spvId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Supervisor'
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

const secretCodeSpv = mongoose.model('secretCodeSpv', secretSchema)
export default secretCodeSpv