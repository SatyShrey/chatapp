/* eslint-disable no-undef */

const express = require("express")
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
const cors = require("cors")
app.use(cors())

//...................socket.io global variables..................
const http = require("http")
const { Server } = require("socket.io")
const server = http.createServer(app)
const origin = 'https://gglchat.netlify.app'
//const origin="http://localhost:5173"
const io = new Server(server, { cors: { origin: origin } })
let userArray=[]


//..........................mongodb global variables..................................
const mongoClient = require("mongodb").MongoClient
const conStr = 'mongodb+srv://sndsatya:QtAy7QbfwCnzUhvu@clustersnd.adfao0n.mongodb.net'
//const conStr="mongodb://127.0.0.1:27017"

//.........default page.....................
app.get('/', (req, res) => {
    res.send("Hi, this is an web api for chat application using NodeJS.")
})

mongoClient.connect(conStr).then(clientObject => {
    var db = clientObject.db('gglchats')

    //............socket.io.....................
    io.on('connection', (socket) => {
        let a = socket.handshake.auth.id//receive the google user uid as 'a'
        userArray=[...new Set([...userArray,a])]
        io.emit("online-users",userArray)
    
    //update socket id
     app.put('/updatesocket/:id',(req,res)=>{
        db.collection('users').updateOne({id:req.params.id},{$set:req.body})
        .then(data=>res.send(data))
     })

    //add chat to database and emit to the receiver
    app.post('/addchat/:id', (req, res) => {
        db.collection('chats').insertOne(req.body)
            .then(data => {
                res.send(data)
                io.to(req.params.id).emit('receive',req.body)
            })
    })

    //..............add a new user...................
    app.post('/setuser', (req, res) => {
        db.collection('users').insertOne(req.body)
            .then(data => res.send(data))
    })

    //.............update an user...................
    app.put('/updateuser/:id', (req, res) => {
        db.collection('users').updateOne({ id: req.params.id }, { $set: req.body })
            .then(data => {res.send(data)})
    })

    //...............executed on disconnect of a client............................
        socket.on('disconnect', () => {
            db.collection('users').updateOne({ id: a }, { $set: { status: "offline" } })
            userArray=userArray.filter(f=>f!==a)
        })

    })



//...................codes that can be executed without web socket connection.....................
    app.get("/users", (req, res) => {
        db.collection('users').find({}).toArray()
            .then(users => { res.send(users) })
    })

    app.get("/userbyemail/:id", (req, res) => {
        db.collection('users').find({ email: req.params.id }).toArray()
            .then(users => { res.send(users[0]) })
    })

    app.get("/users/:id", (req, res) => {
        db.collection('users').find({ id: req.params.id })
            .toArray().then(users => { res.send(users[0]) })
    })

    app.put('/updateuser/:id', (req, res) => {
        db.collection('users').updateOne({ id: req.params.id }, { $set: req.body })
            .then(data => res.send(data))
    })

    app.get('/chats/:id/:id2', (req, res) => {
        db.collection('chats').find({ $or: [{ p1: req.params.id, p2: req.params.id2 }, { p1: req.params.id2, p2: req.params.id }] }).
            toArray().then(data => { res.send(data) })
    })

    app.get('/userlist/:id', (req, res) => {
        let arr = []
        db.collection('chats').find({ $or: [{ p1: req.params.id }, { p2: req.params.id }] }).toArray().then(data => {
            data.forEach(a => {
                if(a.p1===req.params.id){if(arr.includes(a.p2)==false){arr.push(a.p2)}}
                else if(a.p2===req.params.id){if(arr.includes(a.p1)===false){arr.push(a.p1)}}
            })
        }).then(()=>{
            db.collection("users").find({ id: { $in: arr } }).toArray()
            .then((users =>{ res.send(users);res.end()}))
        })
    })

})

//..............listen to the server at port 6060..................
server.listen(6060, () => { console.log('io started:6060') })
