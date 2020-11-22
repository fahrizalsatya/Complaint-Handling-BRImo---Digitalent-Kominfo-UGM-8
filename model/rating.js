import mongoose from 'mongoose'
//const Schema = mongoose.Schema, ObjectId = Schema.ObjectId

const ratingSchema = mongoose.Schema({
    id_ticket: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    id_admin: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
})

const Rating = mongoose.model('Rating', ratingSchema)
export default Rating