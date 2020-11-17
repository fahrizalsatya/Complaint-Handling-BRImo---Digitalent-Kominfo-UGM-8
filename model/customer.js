import mongoose from 'mongoose'

const customerSchema = mongoose.Schema(
    {
        name:{
            type: String,
            required: true
        },
        email:{
            type: String,
            required: true
        },
        password:{
            type: String,
            required: true
        },
        account_number:{
            type: String,
            required: true
        },
        no_ktp:{
            type: String,
            required: true
        },
    }
)

const Customer = mongoose.model('Customer',customerSchema)

export default Customer