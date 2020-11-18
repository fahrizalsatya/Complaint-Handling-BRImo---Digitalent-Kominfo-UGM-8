import mongoose from 'mongoose'

const ratingSchema = mongoose.Schema({
   id_ticket: {
      type: String,
      required: true
   },
   id_cs: {
      type: String,
      required: true
   },
   rating: {
      type: Number,
      required: true
   }
})

const Rating = mongoose.model('Rating', ratingSchema)
export default Rating