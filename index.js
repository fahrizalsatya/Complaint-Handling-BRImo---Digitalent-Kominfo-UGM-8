import express from 'express'
import morgan from 'morgan'
import mongoose from 'mongoose'
import CustomerRouter from './controller/CustomerController.js'
import csRouter from './controller/CsController.js'
import SpvRouter from './controller/SpvController.js'
import ticketRouter from './controller/TicketController.js'
import uploadRouter from './controller/UploadController.js'
import cors from 'cors'

import dotenv from 'dotenv'
dotenv.config()

const app = express()

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log('Connected to MongoDB Successful!')
}).catch(err => {
    console.log('Failed to Connect Database')
    console.log(err)
})

app.use(morgan('dev'))
app.use(express.json())
app.use(cors)

app.get('/', (req, res) => {
    res.json({ message: "Success!" })
})

app.use('/api/customer', CustomerRouter)
app.use('/api/cs', csRouter)
app.use('/api/spv', SpvRouter)

app.use('/api/customer/tickets', ticketRouter)
app.use('/api/cs/tickets', ticketRouter)
app.use('/api/spv/tickets', ticketRouter)

app.use('/api/file', uploadRouter)
const port = 8001
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})