import express from 'express'
import Ticket from '../model/ticket.js'
import Rating from '../model/rating.js'
import JWT from 'jsonwebtoken'
import Config from '../config/config.js'
import bodyParser from 'body-parser'

const ticketRouter = express.Router()

ticketRouter.use(bodyParser.urlencoded({extended:false}))
ticketRouter.use(bodyParser.json())

// POST: /api/customer/tickets/init_ticket
// Customer membuat tiket komplain
ticketRouter.post('/init_ticket', async(req, res) => { 
   try {
      const {
         complaint_name,
         categoryName,
         categoryDetail,
         description,
         screenshot,
         url_video
      } = req.body
      
      var random = Math.floor(Math.random()*10000)+1000

      var token = req.headers['x-access-token']
      if (!token) 
         return res.status(401).send({ auth: false, message: 'TIdak ada token yang diberikan!' })

      JWT.verify(token, Config.secret, async(err, decode) => {
         if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!'})
         
         const ticket_id = 'T-'+String(random)
         const id_cust = decode.customer._id
         const name = categoryName
         const detail = categoryDetail
         
         const createdTicket = new Ticket({
            ticket_id,
            complaint_name,
            description,
            category: {
               name,
               detail
            },
            screenshot,
            url_video,
            id_cust,
         })

         const savedTicket = await createdTicket.save()
         
         res.status(200).json({ message: 'Berhasil membuat tiket!' })
      })
   } catch (error) {
      res.status(500).json({ error: error })
   }
})

// GET: /api/customer/tickets/lists
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
            id_cust, tag: { $ne: 'CLOSED' }
         }, {
            _id: 1,
            id_ticket: 1,
            complaint_name: 1,
            tag: 1,
            status: 1,
            id_cust: 1,
            assigned_to: 1
         })
   
         if(listTicketCust && listTicketCust.length !==0)
            res.status(200).json(listTicketCust)
         else
            res.status(404).json({ message: 'Anda belum membuat tiket komplain'})
   })
})

// GET: /api/customer/tickets/history
// Customer melihat daftar tiket yang sudah selesai (closed) dan dirating
ticketRouter.get('/history', async(req, res) => {
   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
   
   JWT.verify(token, Config.secret, async(err, decode) => {
      if (err)
         return res.status(500).send({ auth: false, message: 'Gagal mengauntentikasi token!' })
      
      const id_cust = decode.customer._id
      
      const listClosedTicket = await Ticket.aggregate([
         {
            $match: { tag: 'CLOSED' }
         }, {
            $lookup: {
               from: 'ratings',
               localField: '_id',
               foreignField: 'id_ticket',
               as: 'rating'
            }
         }/*, {
            $project: {
               _id: 1, // ObjectId tiket
               ticket_id: 1,
               complaint_name: 1,
               tag: 1,
               status: 1,
            }
         }*/
      ])
      
      /*const listClosedTicket = await Ticket.find({
         id_cust, tag: 'CLOSED'
      }, {
         _id: 1,
         ticket_id: 1,
         complaint_name: 1,
         tag: 1,
         status: 1,
      })*/
      
      if(listClosedTicket && listClosedTicket.length !== 0)
         res.status(200).json(listClosedTicket)
      else
         res.status(404).json({ message: 'Anda belum mempunyai tiket yang selesai!'})
   })
})

// POST: /api/customer/tickets/:id/rate
// Customer memberi rating ke tiket yang sudah selesai (CLOSED)
ticketRouter.post('/:id/rate', async(req, res) => {
   const id_ticket = req.params.id
   const { id_admin, rating } = req.body

   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!'})

   JWT.verify(token, Config.secret, async(err, decode) => {
      if (err)
         return res.status(500).send({ auth: false, message: 'Gagal mengautentikasi token!'})
      
      const createRating = new Rating({
         id_ticket,
         id_admin,
         rating,
      })

      const savedRating = await createRating.save()

      res.status(200).json({ message: 'Terimakasih telah memberi rating!' })
   })
})

//ticket list unread for CS
//GET api/cs/tickets/ticket-list/unread
ticketRouter.get('/ticket-list/unread', async(req, res) => {
    var token = req.headers['x-access-token']
    if (!token) {
       return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
      }
      JWT.verify(token, Config.secret, async(err, decode) =>{
         if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
         }
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
    
})

//Klaim tiket oleh CS and SPV
//PUT /api/spv/tickets/ticket_id/get-ticket
//PUT /api/cs/tickets/ticket_id/get-ticket
ticketRouter.put('/ticket_id/get-ticket', async(req, res) => {
    //const [idTicket, idCS] = req.body
    var token = req.headers['x-access-token']
    if (!token) {
       return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
      }
      JWT.verify(token, Config.secret, async(err, decode) =>{
         if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
         }
         const ticket = await Ticket.findById(req.query.ticket_id)
          if (ticket) {
             ticket.assigned_to = decode.customer.name,
             ticket.tag = "ON PROGRESS",
             ticket.status= "READ"
             const updateTicket = await ticket.save()
             res.status(200).json(updateTicket)
            } else {
               res.status(201).json({
                  message: "Update ticket failed"
               })
            }
         })
})

//Endpoint untuk mencari tiket yang telah diassign pada diri sendiri berdasarkan tag dan category
//GET /api/spv/tickets/ticket-list/:id_user
//GET /api/cs/tickets/ticket-list/:id_user

ticketRouter.get('/ticket-list/:id_user',async(req,res)=>{
    var token = req.headers['x-access-token']
    if(!token){
        return res.status(401).send({auth:false, message:'Tidak ada token yang diberikan'})
    }
    JWT.verify(token,Config.secret,async(err,decode)=>{
        if(err){
            return res.status(500).send({auth:false, message:'Failed to authenticate token'})
        }
        const tickets = await Ticket.find({
            assigned_to:String(req.params.id_user),
            category : String(req.query.category),
            tag : String(req.query.tag)
        })
        if(tickets){
            res.status(200).json(tickets)
        } else {
            res.status(201).json({
                message: 'Ticket not found'
            })
        }
    })
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

//Update tag ticket for CS and SPV
//PUT /api/spv/tickets/ticket_id/update-tag
//PUT /api/cs/tickets/ticket_id/update-tag
ticketRouter.put('/ticket_id/update-tag', async(req,res)=>{
   var token = req.headers['x-access-token']
   if (!token) {
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
     }
     JWT.verify(token, Config.secret, async(err, decode) =>{
        if (err) {
           return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
        }
        const ticket = await Ticket.findById(req.query.ticket_id)
        if (ticket) {
           ticket.tag = String(req.query.tag)
           const updateTicket= await ticket.save()
           res.status(200).json(updateTicket)
        }else{
         res.status(201).json({
            message: "Updated ticket tag failed"
         })
        }
      })
})

//Update category ticket for CS and SPV
//PUT /api/spv/tickets/ticket_id/update-category
//PUT /api/cs/tickets/ticket_id/update-category
ticketRouter.put('/ticket_id/update-category', async(req,res)=>{
   var token = req.headers['x-access-token']
   if (!token) {
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
     }
     JWT.verify(token, Config.secret, async(err, decode) =>{
        if (err) {
           return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
        }
        const ticket = await Ticket.findById(req.query.ticket_id)
        if (ticket) {
           ticket.category = String(req.query.category)
           const updateTicket= await ticket.save()
           res.status(200).json(updateTicket)
        }else{
         res.status(201).json({
            message: "Updated ticket category failed"
         })
        }
      })
})

export default ticketRouter
