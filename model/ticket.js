import mongoose from 'mongoose'

const ticketSchema = mongoose.Schema({
    complaint_name: {
        type: String,
        required: true
    },
    ticket_id: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    screenshot: {
        type: String,
        required: false
    },
    url_video: {
        type: String,
        required: false
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refpath: 'onModel'
    },
    onModel: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        enum: ['Supervisor', 'Customer_Services']
    },
    tag: {
        type: String,
        required: true,
        uppercase: true
    },
    status: {
        type: String,
        default: "unread",
        required: true,
        uppercase: true
    },
    id_cust: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
}, {
    timestamps: true,
})

const Ticket = mongoose.model('Ticket', ticketSchema)
export default Ticket