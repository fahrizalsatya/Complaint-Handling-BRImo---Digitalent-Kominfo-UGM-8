import express from 'express'
import Ticket from '../model/ticket.js'
import Rating from '../model/rating.js'
import JWT from 'jsonwebtoken'
import Config from '../config/config.js'
import bodyParser from 'body-parser'
//import uploadRouter from './UploadController.js'

const ticketRouter = express.Router()

ticketRouter.use(bodyParser.urlencoded({extended:false}))
ticketRouter.use(bodyParser.json())
//ticketRouter.use('/init_ticket', uploadRouter)

// Customer membuat tiket komplain dan secara otomatis mengisi nilai rating 0
ticketRouter.post('/init_ticket', async(req, res) => {
   // Insert logic here
   
   try {
      const { complaint_name, categoryName, categoryDetail, description, screenshot, url_video } = req.body
      var random = Math.floor(Math.random()*10000)+1000

      var token = req.headers['x-access-token']
      if (!token) 
         return res.status(401).send({ auth: false, message: 'TIdak ada token yang diberikan!' })

      JWT.verify(token, Config.secret, async(err, decode) => {
         if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!'})
         
         const id_ticket = 'T-'+String(random)
         const id_cust = decode.customer._id
         const assigned_to = '-'
         const tag = 'Submitted'
         const status = 'Unread'
         const name = categoryName
         const detail = categoryDetail
         
         const createdTicket = new Ticket({
            id_ticket,
            complaint_name,
            description,
            category: {
               name,
               detail
            },
            screenshot,
            url_video,
            assigned_to,
            tag,
            status,
            id_cust,
         })

         const createdRating = new Rating({
            id_ticket,
            id_cs: '-',
            rating: 0,
         })

         const savedTicket = await createdTicket.save()
         const savedRating = await createdRating.save()
         
         res.status(200).json({ message: 'Berhasil membuat tiket!' })
      })
   } catch (error) {
      res.status(500).json({ error: error})
   }
})

// Customer melihat daftar tiket yang aktif
ticketRouter.get('/lists', async(req, res) => {
   // Insert logic here
   
   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
   
   JWT.verify(token, Config.secret, async(err, decode) => {
      if (err)
         return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
      
      const id_cust = decode.customer._id
      const listTicketCust = await Ticket.find({
         id_cust, tag: { $ne: 'Closed' }
      }, {
         _id: 1,
         id_ticket: 1,
         complaint_name: 1,
         tag: 1,
         status: 1
      })
      
      if(listTicketCust && listTicketCust.length !==0)
         res.status(200).json(listTicketCust)
      else
         res.status(404).json({ message: 'Anda belum membuat tiket komplain'})
   })
})

// Customer melihat daftar tiket yang sudah selesai (closed) dan dirating
ticketRouter.get('/history', async(req, res) => {
   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
   
   JWT.verify(token, Config.secret, async(err, decode) => {
      if (err)
         return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
      
      const id_cust = decode.customer._id
      const listTicketCust = await Ticket.find({
         id_cust, status: 'Closed'
      }, {
         _id: 0,
         id_ticket: 1,
         complaint_name: 1,
         status: 1,
      })
      
      if(listTicketCust && listTicketCust.length !== 0)
         res.status(200).json(listTicketCust)
      else
         res.status(404).json({ message: 'Anda belum membuat tiket komplain'})
   })
})

ticketRouter.put('/:id/rate', async(req, res) => {
   const { nilaiRating } = req.body
   // Ambil rating tiket berdasarkan id_ticket pada koleksi rating
   const ratingTicket = await Rating.find({id_ticket: req.params.id})

   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!'})

   JWT.verify(token, Config.secret, async(err, decode) => {
      if (err)
         return res.status(500).send({ auth: false, message: 'Gagal mengautentikasi token!'})
      
      ratingTicket.rating = nilaiRating
      const updatedRating = await ratingTicket.save()

      res.status(200).json(updatedRating)
   })
})

//GET ticket list unread
ticketRouter.get('/ticket-list/unread', async(req, res) => {
    // Insert logic here
    const tickets = await Ticket.aggregate([
        { $match: { status: "UNREAD" } }
    ])
    if (tickets != null) {
        res.status(200).json(tickets)
    } else {
        res.status(201).json({
            message: "Ticket is empty"})
    }
})

//PUT Claim ticket
ticketRouter.put('/get-ticket', async(req, res) => {
    //const [idTicket, idCS] = req.body
    const ticket = Ticket.findById(req.query.id_ticket)
    if (ticket) {
        Ticket.aggregate([{
            $replaceWith: { assigned_to: String(req.query.id_cs), tag: "ON PROGRESS", status: "READ"}
        }])

        const updateTicket = await ticket.save()
        res.status(200).json(updateTicket)
    } else {
        res.status(201).json({
            message: "Update ticket failed"
        })
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
//POST api/customer/my-ticket/:id_user/close
//POST api/spv/my-ticket/:id_user/close
//POST api/cs/my-ticket/:id_user/close
ticketRouter.post('/my-ticket/:id_ticket/close', async(req, res) => {
    const { id_ticket } = req.body
    const closedTicket = await Ticket.updateOne({ id_ticket: id_ticket }, { $set: { tag: 'CLOSED' } }).catch(err => res.status(400).send(err.message))
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