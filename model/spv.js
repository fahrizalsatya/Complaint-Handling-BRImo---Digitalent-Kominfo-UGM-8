import mongoose from 'mongoose'

const spvSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    personal_id: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
})

const Supervisor = mongoose.model('Supervisor', spvSchema)
export default Supervisor