import express from 'express'
import Ticket from '../model/ticket.js'

const ticketRouter = express.Router()

// Create ticket by Customers
ticketRouter.post('/init_ticket', async(req, res) => {
   // Insert logic here
   
})

ticketRouter.get('/', async(req, res) => {
   // Insert logic here
})

export default ticketRouter