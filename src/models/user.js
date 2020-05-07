const mongoose = require('mongoose')
const Task = require('../models/task')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid!')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age can not be a negative number.')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        //minlength: 7 --> we can use this instead of custom validator
        validate(value) {
            const f = value.toLowerCase().includes('password')
            if(value.length < 6){
                throw new Error('Password is too short!')
            } else if(f){
                throw new Error('Password can not contain the word - "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// For fetching all the tasks created by a specific user = used in Fetch all the Tasks in Task router
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// Prevent displaying Password and Token when Create user and Login user sends response back to Server = This function is working without calling anywhere
userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Generates Authorization tokens - Used in Create User and Login User in User Routes
userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    
    user.tokens = user.tokens.concat({token})
    await user.save()
    
    return token
}

// Function used in User Login router
userSchema.statics.findByCredentials = async(email, password) => {
    const user = await User.findOne({ email })

    if(!user) {
        throw new Error('Unable to login!')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Unable to login! Wrong password.')
    }

    return user
} 

// Hash the password before it is stored
userSchema.pre('save', async function (next) {
    
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete tasks of a user who deletes his profile
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User