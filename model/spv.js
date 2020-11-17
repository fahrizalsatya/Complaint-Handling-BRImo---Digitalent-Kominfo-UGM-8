import mongoose from 'mongoose'

const spvSchema = mongoose.Schema(
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
    }
)

const Supervisor = mongoose.model('Supervisor',spvSchema)

export default Supervisor