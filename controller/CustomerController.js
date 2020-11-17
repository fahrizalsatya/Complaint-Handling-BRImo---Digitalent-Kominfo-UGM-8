import express from 'express'
import bodyParser from 'body-parser'
import Customer from '../model/customer.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Config from '../config/config.js'

const CustomerRouter = express.Router()

CustomerRouter.use(bodyParser.urlencoded({ extended: false }))
CustomerRouter.use(bodyParser.json())


//SMTP Transport
var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});
var rand, mailOptions, host, link;

//SignUp
//POST /api/customer/signup
CustomerRouter.post('/sign-up', async(req, res) => {
    try {
        const { name, email, password, account_number, no_ktp } = req.body
        const findCust = await Customer.findOne({ email })
        const findAccountNum = await Customer.findOne({ account_number })
        const findNoKTP = await Customer.findOne({ no_ktp })

        if (findCust || findAccountNum || findNoKTP) {
            res.status(201).json({ message: 'Tidak dapat membuat akun baru, periksa kembali data diri anda.' })
        } else {
            var saltRounds = 5
            const hashedPassword = await bcrypt.hash(password, saltRounds)

            const createdCust = new User({
                "name": name,
                "email": email,
                "password": hashedPassword,
                "account_number": account_number,
                "no_ktp": no_ktp,
            })

            const savedCust = await createdCust.save()
            res.status(201).json(savedCust, {
                "status": "Akun customer baru berhasil ditambahkan."
            })

            //SEND MAIL VERIFICATION
            //random token
            rand = Math.floor((Math.random() * 100) + 54);
            host = req.get('host')

            //link token
            link = "http://" + req.get('host') + "/verify?id=" + rand;

            //Send link token to mail
            mailOptions = {
                to: req.query.to,
                subject: "Please confirm your Email account",
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
            }
            console.log(mailOptions);
            smtpTransport.sendMail(mailOptions, function(err, res) {
                if (err) {
                    console.log(err);
                    res.end("error");
                } else {
                    console.log("Message sent: " + res.message);
                    res.end("sent");
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

//Verify
//GET /api/customer/verify?id=?
CustomerRouter.get('/verify', function(req, res) {
    console.log(req.protocol + ":/" + req.get('host'));
    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
        console.log("Domain is matched. Information is from Authentic email");
        if (req.query.id == rand) {
            console.log("email is verified");
            res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
        } else {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    } else {
        res.end("<h1>Request is from unknown source");
    }
});

//Login endpoint untuk customer
CustomerRouter.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body

        const currentCustomer = await new Promise((resolve, reject) => {
            Customer.find({ "email": email }, function(err, customer) {
                if (err) reject(err)
                resolve(customer)
            })
        })
        if (currentCustomer[0]) {
            bcrypt.compare(password, currentCustomer[0].password).then(function(result, err) {
                if (result) {
                    if (err) return res.status(500).send("Terdapat masalah saat registering user")
                    const customer = currentCustomer[0]
                    var token = jwt.sign({ customer }, Config.secret, {
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
                "status": "Username not found"
            })
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})

export default CustomerRouter