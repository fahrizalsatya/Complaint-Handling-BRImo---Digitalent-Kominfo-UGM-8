import mongoose from 'mongoose'

const ratingSchema = mongoose.Schema({
    ticket_id: {
        type: String,
        required: true,
    },
    id_cs: {
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