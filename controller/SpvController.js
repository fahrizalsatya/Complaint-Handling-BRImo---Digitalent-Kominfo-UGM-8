import express from 'express'
import bodyParser from 'body-parser'
import Supervisor from '../model/spv.js'
import Supervisor from '../model/cs.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Config from '../config/config.js'

const SpvRouter = express.Router()

SpvRouter.use(bodyParser.urlencoded({ extended: false }))
SpvRouter.use(bodyParser.json())

//Login SPV
//POST /api/spv/login
SpvRouter.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body
        const currentSpv = await new Promise((resolve, reject) => {
            Supervisor.find({ "email": email }, function(err, spv) {
                if (err) reject(err)
                resolve(spv)
            })
        })
        if (currentSpv[0]) {
            bcrypt.compare(password, currentSpv[0].password).then(function(result, err) {
                if (result) {
                    if (err) return res.status(500).send("Terdapat masalah saat login SPV")
                    const supervisor = currentSpv[0]
                    var token = jwt.sign({ supervisor }, Config.secret, {
                        expiresIn: '1m'
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
                "status": "email not found"
            })
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

//Mendaftarkan CS
//POST /api/spv/add-cs
spvRouter.post('/add-cs', async(req, res) => {
    try {
        const { name, personal_id, email, password, photo, pub_name, pub_photo, final_rating } = req.body
        const csAccount = await CustService.findOne({ email })

        if (csAccount) {
            res.status(201).json({
                message: 'Email telah terdaftar'
            })
        } else {
            var saltRounds = 12
            const hashedPw = await bcrypt.hash(password, saltRounds)
            const createdCS = new CustService({
                "name": name,
                "personal_id": personal_id,
                "email": email,
                "password": hashedPw,
                "photo": photo,
                "pub_name": pub_name,
                "pub_photo": pub_photo,
                "final_rating": final_rating
            })
            const savedCS = await createdCS.save()
            res.status(201).json(savedCS)
        }
    } catch (error) {
        res.status(500).json({
            error: error
        })
    }
})

export default SpvRouter