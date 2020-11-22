import express from 'express'
import Ticket from '../model/ticket.js'
import Rating from '../model/rating.js'
import jwt from 'jsonwebtoken'
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

      jwt.verify(token, Config.secret, async(err, decode) => {
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
   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
   
   jwt.verify(token, Config.secret, async(err, decode) => {
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
// Customer melihat daftar tiket yang sudah selesai (CLOSED) dan beserta RATING-nya
ticketRouter.get('/history', async(req, res) => {
   var token = req.headers['x-access-token']
   if (!token)
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
   
   jwt.verify(token, Config.secret, async(err, decode) => {
      if (err)
         return res.status(500).send({ auth: false, message: 'Gagal mengauntentikasi token!' })
      
      const id_cust = decode.customer._id
      
      /*const listClosedTicket = await Rating.aggregate([
         {
            $lookup: {
               from: 'tickets',
               //localField: 'id_ticket',
               //foreignField: '_id',
               pipeline: [{ $match: { tag: 'CLOSED' } }],
               as: 'ticket'
            }
         }, {
            $project: {
               _id: 0, // objectId Rating
               rating: 1,
               'ticket.ticket_id': 1,
               'ticket.complaint_name': 1,
               'ticket.tag': 1,
               'ticket.status': 1,
            }
         }
      ])*/

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
         }, {
            $project: { // Filter field yang mau ditampilkan / tidak
               _id: 1, // ObjectId ticket
               ticket_id: 1,
               complaint_name: 1,
               tag: 1,
               status: 1,
               rating: 1,
               createdAt: 0,
               updatedAt: 0,
            }
         }
      ])
      
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

   jwt.verify(token, Config.secret, async(err, decode) => {
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
ticketRouter.get('/lists/unread', async(req, res) => {
    var token = req.headers['x-access-token']
    if (!token) {
       return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
      }
      jwt.verify(token, Config.secret, async(err, decode) =>{
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
      jwt.verify(token, Config.secret, async(err, decode) =>{
         if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
         }
         const ticket = await Ticket.findById(req.query.ticket_id)
          if (ticket) {
             ticket.assigned_to = decode.adminService._id,
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

ticketRouter.get('/lists/:id_user',async(req,res)=>{
    var token = req.headers['x-access-token']
    if(!token){
        return res.status(401).send({auth:false, message:'Tidak ada token yang diberikan'})
    }
    jwt.verify(token,Config.secret,async(err,decode)=>{
        if(err){
            return res.status(500).send({auth:false, message:'Failed to authenticate token'})
        }
        const tickets = await Ticket.find({
            assigned_to:String(req.params.id_user),
            category : {name: String(req.query.category),
            detail:""},
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
//POST api/customer/my-ticket/ticket_id/close
//POST api/spv/my-ticket/ticket_id/close
//POST api/cs/my-ticket/ticket_id/close
ticketRouter.post('/my-ticket/ticket_id/close', async(req, res) => {
   var token = req.headers['x-access-token']
   if (!token) {
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
   }
   jwt.verify(token, Config.secret, async(err, decode) =>{
      if (err) {
         return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
      }
      const ticket = await Ticket.findById(req.query.ticket_id)
      if (ticket) {
         ticket.tag = String('CLOSED')
         const updateTicket= await ticket.save()
         res.status(200).json(updateTicket)
      }else{
      res.status(201).json({
         message: "ticket CLOSED failed"
      })
      }
   })
})

// GET Escalated Ticket List for SPV
//GET api/spv/tickets/lists/escalated
ticketRouter.get('/lists/escalated', async(req, res) => {
   try {
      var token = req.headers['x-access-token']
      if (!token) 
         return res.status(401).send({ auth: false, message: 'TIdak ada token yang diberikan!' })

      jwt.verify(token, Config.secret, async(err, decode) => {
         if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!'})
           
         const tickets = await Ticket.aggregate({
               $match: { tag: 'ESCALATED' }
          })
         if (tickets) {
              res.json(tickets)
         } else {
              res.send("Ticket not found")
           }
      })
   } catch (error) {
      res.status(500).json({ error: error})
   }
 })

//PUT Ticket Reply for Customer, CS, SPV
//PUT api/customer/tickets/reply
//PUT api/cs/tickets/reply
//PUT api/spv/tickets/reply
// ticketRouter.put('/reply', async(req, res) => {
//    try {
//       var token = req.headers['x-access-token']
//       if (!token) 
//          return res.status(401).send({ auth: false, message: 'TIdak ada token yang diberikan!' })

//       jwt.verify(token, Config.secret, async(err, decode) => {
//          if (err)
//             return res.status(500).send({ auth: false, message: 'Failed to authenticate token!'})
//             const id_user = decode.customer._id
//             Chat.findOne({}, async(err, chat)=>{

//             }
//       })
//    } catch (error) {
//       res.status(500).json({ error: error})
//    }
//  })


// try {
//    var token = req.headers['x-access-token']
//    if (!token) 
//       return res.status(401).send({ auth: false, message: 'TIdak ada token yang diberikan!' })

//    jwt.verify(token, Config.secret, async(err, decode) => {
//       if (err)
//          return res.status(500).send({ auth: false, message: 'Failed to authenticate token!'})
//    })
// } catch (error) {
//    res.status(500).json({ error: error})
// }


//Update tag ticket for CS and SPV
//PUT /api/spv/tickets/ticket_id/update-tag
//PUT /api/cs/tickets/ticket_id/update-tag
ticketRouter.put('/ticket_id/update-tag', async(req,res)=>{
   var token = req.headers['x-access-token']
   if (!token) {
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
     }
     jwt.verify(token, Config.secret, async(err, decode) =>{
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
     jwt.verify(token, Config.secret, async(err, decode) =>{
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
