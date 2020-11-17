import express from 'express'
import bodyParser from 'body-parser'
import Customer from '../model/customer.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Config from '../config/config.js'

const CustomerRouter = express.Router()

CustomerRouter.use(bodyParser.urlencoded({extended:false}))
CustomerRouter.use(bodyParser.json())

//Login endpoint untuk customer
CustomerRouter.post('/login',async(req,res)=>{
    try {
        const {email, password} = req.body

        const currentCustomer = await new Promise((resolve,reject)=>{
            Customer.find({"email":email},function(err,customer) {
                if (err) reject(err) 
                resolve(customer)
            })
        })
        if (currentCustomer[0]) {
            bcrypt.compare(password, currentCustomer[0].password).then (function (result,err) {
                if (result){
                    if (err) return res.status(500).send("Terdapat masalah saat registering user")
                    const customer = currentCustomer[0]
                    var token = jwt.sign({customer},Config.secret,{
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

export default CustomerRouter