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

//GET Ticket search based on tag and category endpoint
ticketRouter.get('/ticketlist/search',async(req,res)=>{
    const tickets = await Ticket.aggregate(
        [
            {
                $match:{tag:String(req.query.tag)}
            },
            {
                $match:{category:String(req.query.category)}
            }
        ]
    )
    if(tickets){
        res.json(tickets)
    } else{
        res.send("Ticket not found")
    }
})

export default ticketRouter
