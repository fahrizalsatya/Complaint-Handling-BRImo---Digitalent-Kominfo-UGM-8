import express from 'express'
import Ticket from '../model/ticket.js'

const ticketRouter = express.Router()

ticketRouter.post('/', async(req, res) => {
   // Insert logic here
})

ticketRouter.get('/', async(req, res) => {
   // Insert logic here
})

export default ticketRouter