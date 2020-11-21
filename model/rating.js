import mongoose from 'mongoose'

const ratingSchema = mongoose.Schema({
   id_ticket: {
      type: String,
      required: true
   },
   id_cs: {
      type: String,
      required: false
   },
   rating: {
      type: Number,
      required: false
   }
})

const Rating = mongoose.model('Rating', ratingSchema)
export default Rating