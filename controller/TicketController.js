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
ticketRouter.post('/init-ticket', async(req, res) => { 
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
   try {
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
            ticket_id: 1,
            complaint_name: 1,
            tag: 1,
            status: 1,
            assigned_to: 1,
            createdAt: 1,
            updatedAt: 1
         })
   
         if(listTicketCust && listTicketCust.length !==0)
            res.status(200).json(listTicketCust)
         else
            res.status(404).json({ message: 'Anda belum membuat tiket komplain'})
      })
   } catch (error) {
      res.status(500).json({error:error})
   }
})

// GET: /api/customer/tickets/history
// Customer melihat daftar tiket yang sudah selesai (CLOSED) dan beserta RATING-nya
ticketRouter.get('/history', async(req, res) => {
   try {
      var token = req.headers['x-access-token']
      if (!token)
         return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
      
      jwt.verify(token, Config.secret, async(err, decode) => {
         if (err)
            return res.status(500).send({ auth: false, message: 'Gagal mengauntentikasi token!' })
         
         const id_cust = decode.customer._id
   
         const listClosedTicket = await Ticket.aggregate([
            {
               $match: { id_cust, tag: 'CLOSED' }
            }, {
               $lookup: {
                  from: 'ratings',
                  localField: '_id',
                  foreignField: 'id_ticket',
                  as: 'rating'
               }
            }, {
               $project: { // Filter field yang mau ditampilkan
                  _id: 1, // ObjectId ticket
                  ticket_id: 1,
                  complaint_name: 1,
                  tag: 1,
                  status: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  rating: 1
               }
            }, {
               $project: { // Filter field yang tidak ditampilkan
                  rating: {
                     _id: 0,
                     id_ticket: 0,
                     id_admin: 0,
                     createdAt: 0,
                     updatedAt: 0,
                     __v: 0
                  }
               }
            }
         ])
         
         if(listClosedTicket && listClosedTicket.length !== 0)
            res.status(200).json(listClosedTicket)
         else
            res.status(404).json({ message: 'Anda belum mempunyai tiket yang selesai!'})
      })
   } catch (error) {
      res.status(500).json({error:error})
   }
})

// POST: /api/customer/tickets/:id/rate
// Customer memberi rating ke tiket yang sudah selesai (CLOSED)
ticketRouter.post('/:id/rate', async(req, res) => {
   try {
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
   } catch (error) {
      res.status(500).json({error:error})
   }
})

//ticket list unread for CS
//GET api/cs/tickets/lists/unread
ticketRouter.get('/lists/unread', async(req, res) => {
   try {
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
        if (tickets) {
            res.status(200).json(tickets)
        } else {
            res.status(201).json({
               message: "Ticket is empty"})
        }
      })
   } catch (error) {
      res.status(500).json({
         error: error
     })
   }
})

//Klaim tiket oleh CS and SPV
//PUT /api/spv/tickets/ticket_id/get-ticket
//PUT /api/cs/tickets/ticket_id/get-ticket
ticketRouter.put('/ticket_id/get-ticket', async(req, res) => {
   try {
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
   } catch (error) {
      res.status(500).json({
         error: error
     })
   }
})

//Endpoint untuk mencari tiket yang telah diassign pada diri sendiri berdasarkan tag dan category
//GET /api/spv/tickets/lists/:id_user
//GET /api/cs/tickets/lists/:id_user
ticketRouter.get('/lists/filter',async(req,res)=>{
   try {
      var token = req.headers['x-access-token']
      if(!token){
          return res.status(401).send({auth:false, message:'Tidak ada token yang diberikan'})
      }
      jwt.verify(token,Config.secret,async(err,decode)=>{
          if(err){
              return res.status(500).send({auth:false, message:'Failed to authenticate token'})
          }
          const tickets = await Ticket.find({
              assigned_to:String(decode.adminService._id),
              "category.name" : String(req.query.category),
              "tag" : String(req.query.tag)
          })
          if(tickets){
              res.status(200).json(tickets)
          } else {
              res.status(201).json({
                  message: 'Ticket not found'
              })
          }
      })
   } catch (error) {
      res.status(500).json({error:error})
   }
})

//CLOSE TICKET
//POST api/customer/tickets/ticket_id/close
//POST api/spv/tickets/ticket_id/close
//POST api/cs/tickets/ticket_id/close
ticketRouter.put('/ticket_id/close', async(req, res) => {
   try {
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
   } catch (error) {
      res.status(500).json({error:error})
   }
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
   try {
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
   } catch (error) {
      res.status(500).json({error:error})
   }
})

//Update category ticket for CS and SPV
//PUT /api/spv/tickets/ticket_id/update-category
//PUT /api/cs/tickets/ticket_id/update-category
ticketRouter.put('/ticket_id/update-category', async(req,res)=>{
   try {
      var token = req.headers['x-access-token']
   if (!token) {
      return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
     }
     jwt.verify(token, Config.secret, async(err, decode) =>{
        if (err) {
           return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
        }
        const ticket = await Ticket.findById(req.query.ticket_id)
        const name = req.query.category_name
        if (ticket) {
           if (name!= null ) {
            ticket.category={
               name: String(req.query.category_name)}
           }else{
            ticket.category={
               name: "Other", detail: String(req.query.category_detail)}
           }
           const update_ticket= await ticket.save()
           res.status(200).json(update_ticket)
        }else{
         res.status(201).json({
            message: "Updated ticket category failed"
         })
        }
      })
   } catch (error) {
      res.status(500).json({error:error})
   }
})

//GET my ticket list for CS and SPV
//GET /api/spv/tickets/lists/my-ticket
//PUT /api/cs/tickets/lists/my-ticket
ticketRouter.get('/lists/my_ticket',async(req,res)=>{
   try {
      var token = req.headers['x-access-token']
      if(!token){
          return res.status(401).send({auth:false, message:'Tidak ada token yang diberikan'})
      }
      jwt.verify(token,Config.secret,async(err,decode)=>{
          if(err){
              return res.status(500).send({auth:false, message:'Failed to authenticate token'})
          }
          const tickets = await Ticket.find({
              assigned_to:String(decode.adminService._id),
              "tag": "ON PROGRESS"
          })
          if(tickets){
              res.status(200).json(tickets)
          } else {
              res.status(201).json({
                  message: 'Ticket not found'
              })
          }
      })
   } catch (error) {
      res.status(500).json({error:error})
   }
}
)
export default ticketRouter

//   try {
//    var token = req.headers['x-access-token']
//    if (!token) {
//       return res.status(401).send({ auth: false, message: 'Tidak ada token yang diberikan!' })
//      }
//      jwt.verify(token, Config.secret, async(err, decode) =>{
//         if (err) {
//            return res.status(500).send({ auth: false, message: 'Failed to authenticate token!' })
//         }
//         const listTicket= await Ticket.find({
//            assigned_to:String(decode.adminService._id)
//         })
//         if (listTicket && listTicket.length !== 0) {
//            res.status(200).json(listTicket)
//         } else{
//            res.status(201).json({
//               message: "Ticket empty"
//            })
//         }
//       })
//   } catch (error) {
     
//   } 
// }
