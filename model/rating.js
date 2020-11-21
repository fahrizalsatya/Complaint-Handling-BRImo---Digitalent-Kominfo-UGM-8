import mongoose from 'mongoose'

const ratingSchema = mongoose.Schema({
    id_ticket: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Ticket'
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