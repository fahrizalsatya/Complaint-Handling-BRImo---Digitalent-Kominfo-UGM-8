import mongoose from 'mongoose'

const ticketSchema = mongoose.Schema({
   complaint_name: {
      type: String,
      required: true
   },
   description: {
      type: String,
      required: true
   },
   category: {
      type: String,
      required: true
   },
   assigned_to: {
      type: String,
      required: true
   },
   tag: {
      type: String,
      required: true
   },
   status: {
      type: String,
      required: true
   },
   id_cust: {
      type: String,
      required: true
   },
})

const Ticket = mongoose.model('Ticket', ticketSchema)
export default Ticket