import mongoose from 'mongoose'

const ticketSchema = mongoose.Schema({

   ticket_id: {
      type: String,
      required: true
   },
   complaint_name: {
      type: String,
      required: true
   },
   description: {
      type: String,
      required: true
   },
   category: {
      name: {
         type: String,
         required: true
      },
      detail: {
         type: String,
         required: false
      }
   },
   screenshot: {
      type: String,
      required: false
   },
   url_video: {
      type: String,
      required: false
   },
   assigned_to: {
      type: String,
      default: '-',
      required: true
   },
   tag: {
      type: String,
      required: true,
      default:'SUBMITTED',
      uppercase: true
   },
   status: {
      type: String,
      required: true,
      default: 'UNREAD',
      uppercase:true
   },
   id_cust: {
      type: String,
      required: true
   },
   reply: {
      type: String,
      required: false,
      default: '-',
   },
}, {
   timestamps: true,
})

const Ticket = mongoose.model('Ticket', ticketSchema)
export default Ticket