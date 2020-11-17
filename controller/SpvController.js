import express from 'express'
import bodyParser from 'body-parser'
import Supervisor from '../model/spv.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Config from '../config/config.js'

const SpvRouter = express.Router()

SpvRouter.use(bodyParser.urlencoded({extended:false}))
SpvRouter.use(bodyParser.json())

//Login SPV
SpvRouter.post('/login',async(req,res)=>{
    try {
        const {email,password}=req.body
        const currentSpv= await new Promise((resolve,reject)=>{
            Supervisor.find({"email":email},function(err,spv){
                if(err) reject (err)
                resolve(spv)
            })
        })
        if (currentSpv[0]) {
            bcrypt.compare(password, currentSpv[0].password).then (function (result,err) {
                if (result){
                    if (err) return res.status(500).send("Terdapat masalah saat login SPV")
                    const supervisor = currentSpv[0]
                    var token = jwt.sign({supervisor},Config.secret,{
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
                "status":"email not found"
            })
        }
    } catch (error) {
        res.status(500).json({error:error})
    }
})

export default SpvRouter