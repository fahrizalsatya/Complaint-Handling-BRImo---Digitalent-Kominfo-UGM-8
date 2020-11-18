import express from 'express'
import Ticket from '../model/ticket.js'

const ticketRouter = express.Router()

// Create ticket by Customers
ticketRouter.post('/init_ticket', async(req, res) => {
   // Insert logic here
   
})

//GET ticket list unread
ticketRouter.get('/ticketList/unread', async(req, res) => {
   // Insert logic here
   const ticket= await Ticket.aggregate([
      {$match:{ status : "unread"}}
   ])
   if (ticket != null) {
      res.json(ticket)
   }
   else{
      res.json("Ticket is empty")
   }

})

export default ticketRouter