const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()


// Create a new task
router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})


// Fetch all the tasks created by the user who is currently logged in
// GET /tasks?completed=true&limit=2&skip=2 --> all the values passed are optional
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    try{
        const user = req.user
        const match = {}
        const sort = {}

        if(req.query.completed){
            match.completed = req.query.completed === 'true'
        }

        if(req.query.sortBy){
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }
        // const tasks = await Task.find({ owner: user._id })
        // res.send(tasks) --> 'We can also use this aproach to do this job'
        await user.populate({
            path:'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(user.tasks)
    } catch(e) {
        res.status(500).send(e)
    }
})


// Fetch a perticular task by it's _id
router.get('/tasks/:id', auth, async(req, res) => {
    const _id = req.params.id
    try{
        const task = await Task.findOne({ _id, owner: req.user._id })
        if(!task){
            return res.status(404).send('Task not Found!')
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})


// Update a task 
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const validUpdates = ['description', 'completed']
    const isValid = updates.every((update) => {
        return validUpdates.includes(update)
    })

    if(!isValid){
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try{
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task) {
            return res.status(404).send({error: 'Task not found!'})
        }
        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})


// Delete a task
router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task) {
            return res.status(404).send({error: 'Task not Found!'})
        }
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router