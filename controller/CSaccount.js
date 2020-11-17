import express from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt'
import CustService from '../model/custservice.js'

const csRouter = express.Router()
csRouter.use(bodyParser.urlencoded({extended:false}))
csRouter.use(bodyParser.json())

csRouter.post('/add',async(req,res)=>{
    try {
        const {name, email,password,photo,pub_name,pub_photo,final_rating}=req.body
        const csAccount = await CustService.findOne({email})

        if(csAccount){
            res.status(201).json({
                message : 'Email telah terdaftar'
            })
        } else {
            var saltRounds = 12
            const hashedPw = await bcrypt.hash(password,saltRounds)
            const createdCS = new CustService({
                "name":name,
                "email": email,
                "password":hashedPw,
                "photo":photo,
                "pub_name":pub_name,
                "pub_photo":pub_photo,
                "final_rating":final_rating
            })
            const savedCS = await createdCS.save()
            res.status(201).json(savedCS)
        }
    } catch (error) {
        res.status(500).json({
            error:error
        })
    }
})

export default csRouter