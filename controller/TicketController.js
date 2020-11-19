import express from 'express'
import Ticket from '../model/ticket.js'

const ticketRouter = express.Router()

// Create ticket by Customers
ticketRouter.post('/init-ticket', async(req, res) => {
    // Insert logic here

})

//GET ticket list unread
ticketRouter.get('/ticket-list/unread', async(req, res) => {
    // Insert logic here
    const tickets = await Ticket.aggregate([
        { $match: { status: "unread" } }
    ])
    if (tickets != null) {
        res.json(tickets)
    } else {
        res.send("Ticket is empty")
    }

})

//PUT Claim ticket
ticketRouter.put('/pickticket', async(req, res) => {
    const [idTicket, idCS] = req.body
    const ticket = Ticket.findById(idTicket)
    if (ticket) {
        Ticket.aggregate([{
            $replaceWith: { assigned_to: { idCS } }
        }])

        const updateTicket = await ticket.save()
        res.json(updateTicket)
    } else {
        res.send("Update ticket failed")
    }
})

//GET Ticket search based on tag and category endpoint
ticketRouter.get('/ticket-list/search', async(req, res) => {
    const tickets = await Ticket.aggregate(
        [{
                $match: { tag: String(req.query.tag) }
            },
            {
                $match: { category: String(req.query.category) }
            }
        ]
    )
    if (tickets) {
        res.json(tickets)
    } else {
        res.send("Ticket not found")
    }
})

//CLOSE TICKET
//POST api/customer/ticket-list/close/:id
//POST api/spv/ticket-list/close/:id
//POST api/cs/ticket-list/close/:id
ticketRouter.post('/my-ticket/:id_user/close', async(req, res) => {
    const { ticket_id } = req.body
    const closedTicket = await Ticket.updateOne({ ticket_id: ticket_id }, { $set: { tag: 'CLOSED' } }).catch(err => res.status(400).send(err.message))
    res.status(200).send(closedTicket)
})

//GET Escalated Ticket List for SPV
// ticketRouter.get('/ticket-list/escalated', async(req, res) => {
//     const tickets = await Ticket.aggregate({
//         $match: { tag: 'ESCALATED' }
//     })
//     if (tickets) {
//         res.json(tickets)
//     } else {
//         res.send("Ticket not found")
//     }
// })

//GET Escalated Ticket List by Category for SPV
// ticketRouter.get('/ticket-list/escalated/:category', async(req, res) => {
//     const tickets = await Ticket.aggregate(
//         [{
//                 $match: { tag: 'ESCALATED' }
//             },
//             {
//                 $match: { category: String(req.params.category) }
//             }
//         ]
//     )
//     if (tickets) {
//         res.json(tickets)
//     } else {
//         res.send("Ticket not found")
//     }
// })

export default ticketRouter