const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = new express.Router()

// Create new user profile
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch(e) {
        res.status(400).send(e)
    }
    // user.save().then((user) => {
    //     res.send(user)
    // }).catch((e) => {
    //     res.status(400).send(e)
    // })
})


//Login user
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(e) {
        res.status(400).send(e)
    }
})


//Logout of current login
router.post('/users/logout', auth, async (req, res) => {
    try{
        const user = req.user
        user.tokens = user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await user.save()
        res.send({message:'Logged out successfully!'})
    } catch(e) {
        res.status(500).send()
    }
})


//Logout from all logins    
router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        const user = req.user
        user.tokens = []
        await user.save()
        res.send({message:'Log out from all accounts done!'})
    } catch(e) {
        res.status(500).send()
    }
})


//Fetch own profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})


// Updating Profile
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const isValid = updates.every((update) => {
        return allowedUpdates.includes(update)
    }) //we can also write-const isValid = updates.every((update) =>  allowedUpdates.includes(update))

    if(!isValid){
        return res.status(400).send({error: 'Invalid Update'})
    }

    try{
        const user = req.user
        updates.forEach((update) => {
            user[update] = req.body[update]
        })
        await user.save() 
        res.send(user)
    } catch(e) {
        res.status(400).send(e)
    }
})


//Deleting Profile
router.delete('/users/me', auth, async (req, res) => {
    try{
        // const user = await User.findByIdAndDelete(req.params.id)
        // if(!user){  return res.status(404).send({error: 'No user found!'})  }
        await req.user.remove() //In auth function we have set 'user' to 'req.user' -> we can use it when we include 'auth' in the arguments. 
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
            return cb(new Error('Please upload an image file only!'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send('Avatar uploaded Successfully!')
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send('Avatar Deleted Successfully!')
})

router.get('/users/:id/avatar', async (req, res) => {
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        return res.send('No user or user avatar found!')
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
})

module.exports = router