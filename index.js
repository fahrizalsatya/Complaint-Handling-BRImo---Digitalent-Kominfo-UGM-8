import express from 'express'
import morgan from 'morgan'
import mongoose from 'mongoose'
import CustomerRouter from './controller/CustomerController.js'
import csRouter from './controller/CsController.js'
import SpvRouter from './controller/SpvController.js'
import ticketRouter from './controller/TicketController.js'


const app = express()

mongoose.connect("mongodb://localhost:27017/complaint-handling", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Database Succesfully Connected')
}).catch(err => {
    console.log('Failed to Connect Database')
    console.log(err)
})

app.use(morgan('dev'))
app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: "Succes"
    })
})

app.use('/api/customer', CustomerRouter)
app.use('/api/cs', csRouter)
app.use('api/spv', SpvRouter)
app.use('api/ticket',ticketRouter)


const port = 8000

app.listen(port, () => {
    console.log(`App listens on port ${port}`)
});
