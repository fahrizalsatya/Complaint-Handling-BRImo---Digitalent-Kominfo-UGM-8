import express from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt'
import CustService from '../model/cs.js'
import jwt from 'jsonwebtoken'
import Config from '../config/config.js'

const csRouter = express.Router()
csRouter.use(bodyParser.urlencoded({ extended: false }))
csRouter.use(bodyParser.json())

csRouter.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body

        const currentCS = await new Promise((resolve, reject) => {
            CustService.find({ "email": email }, function(err, cs) {
                if (err) reject(err)
                resolve(cs)
            })
        })
        if (currentCS[0]) {
            bcrypt.compare(password, currentCS[0].password).then(function(result, err) {
                if (result) {
                    if (err) return res.status(500).send("Terdapat masalah saat login CS")
                    const adminService = currentCS[0]
                    var token = jwt.sign({ adminService }, Config.secret, {
                        expiresIn: '1d'
                    })
                    res.status(200).send({ auth: true, "status": "Success!!", token: token })
                } else {
                    res.status(201).json({
                        "status": "wrong password"
                    })
                }
            })
        } else {
            res.status(201).json({
                "status": "Username not found"
            })
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

csRouter.get('/logout', async(req, res) => {
    try {
        var token = req.headers['x-access-token']
        if (!token) 
         return res.status(401).send({ auth: false, message: 'TIdak ada token yang diberikan!' })
        //jwt.destroy(token)

    }
    catch (error) {
        res.status(500).json({ error: error })
    }
})
export default csRouter