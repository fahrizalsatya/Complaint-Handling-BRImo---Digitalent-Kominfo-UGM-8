import express from 'express'
import bodyParser from 'body-parser'
import Supervisor from '../model/spv.js'
import CustService from '../model/cs.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import Config from '../config/config.js'
import secretCodeSpv from '../model/secretCodeSpv.js'
import nodemailer from 'nodemailer'
import generator from 'generate-password'

const SpvRouter = express.Router()

SpvRouter.use(bodyParser.urlencoded({ extended: false }))
SpvRouter.use(bodyParser.json())

//SignUp
//POST /api/spv/signup
SpvRouter.post('/signup', async(req, res) => {
    try {
        const { name, email, password, personal_id } = req.body
        Supervisor.findOne({ $or: [{ email }, { personal_id }] }, async(err, spv) => {
            if (spv) {
                res.status(201).json({ message: 'The email address or identity you have entered is already associated with another account.' })
            } else {
                var saltRounds = 12
                const hashedPassword = await bcrypt.hash(password, saltRounds)

                spv = new Supervisor({
                    "name": name,
                    "email": email,
                    "password": hashedPassword,
                    "personal_id": personal_id
                })

                // Create and save the spv
                spv.save(function(err) {
                    if (err) {
                        return res.status(500).json({ msg: err.message });
                    }
                    // Create a verification token for this customer
                    var token = new secretCodeSpv({ _spvId: spv._id, token: crypto.randomBytes(16).toString('hex') });
                    console.log(token)

                    // Save the verification token
                    token.save(function(err) {
                        if (err) { return res.status(500).json({ msg: err.message }); }
                        console.log('Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/customer\/verify\/' + spv.email + '\/' + token.token)

                        //Show in Postman Only
                        //res.status(200).json('Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/customer\/verify\/' + customer.email + '\/' + token.token)

                        // Send the email
                        var transporter = nodemailer.createTransport({ name: 'no-reply@BRImo.com', host: 'smtp.ethereal.email', port: 587, auth: { user: process.env.MAIL, pass: process.env.PASS } });
                        var mailOptions = { from: process.env.MAIL, to: spv.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/customer\/verify\/' + spv.email + '\/' + token.token };
                        transporter.sendMail(mailOptions, function(err) {
                            if (err) { return res.status(500).json({ msg: err.message }); }
                            res.status(200).json('A verification email has been sent to ' + spv.email + '.');
                            //res.status(200).json('A verification email has been sent to ' + customer.email + '.\n', 'Message sent: %s', info.messageId + '\n' + 'Preview URL: %s', nodemailer.getTestMessageUrl(info));
                        });
                    });
                })
            }
        })
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

//SEND MAIL
// api/spv/resend
SpvRouter.post('/resend', async(req, res) => {
    Supervisor.findOne({ email: req.body.email }, function(err, spv) {
        if (!spv) return res.status(201).json({ msg: 'We were unable to find a user with that email.' });
        if (spv.isVerified) return res.status(201).json({ msg: 'This account has already been verified. Please log in.' });

        // Create a verification token, save it, and send email
        var token = new secretCodeSpv({ _spvId: spv._id, token: crypto.randomBytes(16).toString('hex') });
        console.log(token)
        console.log('Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/customer\/verify\/' + spv.email + '\/' + token.token)

        //Show in Postman only
        //res.status(200).json('Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/customer\/verify\/' + customer.email + '\/' + token.token)

        // Save the token
        token.save(function(err) {
            if (err) { return res.status(500).json({ msg: err.message }); }

            // Send the email
            var transporter = nodemailer.createTransport({ name: 'no-reply@BRImo.com', host: 'smtp.ethereal.email', port: 587, auth: { user: process.env.MAIL, pass: process.env.PASS } });
            var mailOptions = { from: process.env.MAIL, to: spv.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/api\/customer\/verify\/' + spv.email + '\/' + token.token };
            transporter.sendMail(mailOptions, function(err) {
                if (err) { return res.status(500).json({ msg: err.message }); }
                res.status(200).json('A verification email has been sent to ' + spv.email + '.')
                    //res.status(200).json('A verification email has been sent to ' + spv.email + '.\n', 'Message sent: %s', info.messageId + '\n' + 'Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });
        });

    });
})

//Verify
//POST /api/spv/verify/:email/:token
SpvRouter.post('/verify/:email/:token', async(req, res) => {
    // Find a matching token
    secretCodeSpv.findOne({ token: req.params.token }, function(err, token) {
        if (!token) return res.status(201).json({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

        // If we found a token, find a matching user
        Customer.findOne({ _id: token._spvId, email: req.params.email }, function(err, spv) {
            if (!spv) return res.status(201).json({ msg: 'We were unable to find a user for this token.' });
            if (spv.isVerified) return res.status(201).json({ type: 'already-verified', msg: 'This user has already been verified.' });

            // Verify and save the user
            customer.isVerified = true;
            customer.save(function(err) {
                if (err) { return res.status(500).json({ msg: err.message }); }
                res.status(200).json("The account has been verified. Please log in.");
            });
        });
    });
});

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

//FORGOT PASSWORD
//POST api/spv/forgot-password
SpvRouter.post('/forgot-password', async(req, res) => {
    Supervisor.findOne({ email: req.body.email }, async(err, spv) => {
        if (!spv) return res.status(201).json({ msg: 'We were unable to find a user with that email.' });
        if (spv.isVerified === false) return res.status(201).json({ msg: 'This account has not been verified. Please verify.' });

        //Generate New Password
        var newPassword = generator.generate({
            length: 8,
            numbers: true,
            uppercase: true,
            lowercase: true

        })

        // Hashed Password
        var saltRounds = 12
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

        //Changed Hashed Password
        customer.password = hashedPassword
        console.log(newPassword)
        console.log(customer.password)
        console.log(customer)

        //Show in Postman only
        //res.status(200).json(newPassword)

        // Save the New Password
        spv.save(function(err) {
            if (err) { return res.status(500).json({ msg: err.message }); }

            // Send the email contain new password
            var transporter = nodemailer.createTransport({ name: 'no-reply@BRImo.com', host: 'smtp.ethereal.email', port: 587, auth: { user: process.env.MAIL, pass: process.env.PASS } });
            var mailOptions = { from: process.env.MAIL, to: customer.email, subject: 'Changed Password', text: 'Hello,\n\n' + 'Please input your changed password account by input this new password: ' + newPassword + '.\n' };
            transporter.sendMail(mailOptions, function(err) {
                if (err) { return res.status(500).json({ msg: err.message }); }
                res.status(200).send('A Changed Password has been sent to ' + spv.email + '.');
                //res.status(200).json('A Changed Password has been sent to ' + spv.email + '.\n', 'Message sent: %s', info.messageId + '\n' + 'Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });
        });

    });
})

//CHANGE PASSWORD
//POST /api/spv/change-password
SpvRouter.post('/change-password', async(req, res) => {
    try {
        const { email, password, newPassword } = req.body
        const currentSupervisor = await new Promise((resolve, reject) => {
            Supervisor.find({ "email": email }, function(err, spv) {
                if (err) reject(err)
                resolve(spv)
            })
        })
        if (currentSupervisor[0]) {
            bcrypt.compare(password, currentSupervisor[0].password).then(async(result, err) => {
                if (result) {
                    if (err) return res.status(201).json("Terdapat masalah saat registering user")
                    const spv = currentSupervisor[0]

                    // Hashed Password
                    var saltRounds = 12
                    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

                    //Changed password to Hashed Password
                    spv.password = hashedPassword
                    console.log(spv.newPassword)
                    console.log(spv.password)
                    console.log(spv)

                    //Save New Password
                    spv.save()

                    res.status(200).json({ "status": "Successfully Changed Pasword!!" })
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
SpvRouter.post('/add-cs', async(req, res) => {
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

//List Daftar CS
// GET /api/spv/cs-list

SpvRouter.get('/cs-list',async(req,res)=>{
    const cslist = await CustService.find({})
    res.status(200).json(cslist)
})

export default SpvRouter
