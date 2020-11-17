import express from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt'
import CustService from '../model/cs.js'

const csRouter = express.Router()
csRouter.use(bodyParser.urlencoded({extended:false}))
csRouter.use(bodyParser.json())


//Mendaftarkan CS
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

csRouter.post('/login',async(req,res)=>{
    try {
        const {email, password} = req.body

        const currentCS = await new Promise((resolve,reject)=>{
            CustService.find({"email":email},function(err,cs) {
                if (err) reject(err) 
                resolve(cs)
            })
        })
        if (currentCS[0]) {
            bcrypt.compare(password, currentCS[0].password).then (function (result,err) {
                if (result){
                    if (err) return res.status(500).send("Terdapat masalah saat login CS")
                    const custService = currentCS[0]
                    var token = jwt.sign({custService},Config.secret,{
                        expiresIn: '1m'
                    })
                    res.status(200).send({auth : true,"status":"Success!!",token:token})
                } else {
                    res.status(201).json({
                        "status":"wrong password"
                    })
                }
            })
        } else {
            res.status(201).json({
                "status":"Username not found"
            })
        }
    } catch (error) {
        res.status(500).json({error:error})
    }
})

export default csRouter