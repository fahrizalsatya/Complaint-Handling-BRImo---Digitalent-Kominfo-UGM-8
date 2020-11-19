import mongoose from 'mongoose'

const cserviceSchema = mongoose.Schema({
    name: {
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
    photo: {
        type: String,
        required: true
    },
    pub_name: {
        type: String,
        required: true
    },
    pub_photo: {
        type: String,
        required: true
    },
    final_rating: {
        type: Number,
        required: true
    },
}, {
    timestamps: true,
})

const CustService = mongoose.model('Customer_Services', cserviceSchema)
export default CustService