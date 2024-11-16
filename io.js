/* eslint-disable no-undef */

const express=require("express")
const app=express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
const cors=require("cors")
app.use(cors())

const http=require("http")
const {Server}=require("socket.io")
const server=http.createServer(app)
const origin='https://gglchat.netlify.app'
const io=new Server(server,{cors:{origin:origin}})

//..........................mongodb..................................

const mongoClient=require("mongodb").MongoClient
const conStr='mongodb+srv://sndsatya:QtAy7QbfwCnzUhvu@clustersnd.adfao0n.mongodb.net'

app.get('/',(req,res)=>{
    res.send("Hi Satya.")
})

mongoClient.connect(conStr).then(clientObject=>{
    var db=clientObject.db('gglchats')

io.on('connection',(socket)=>{
    let a=socket.handshake.auth.id
    socket.on('disconnect',()=>{
        db.collection('users').updateOne({uid:a},{$set:{status:"offline"}})
    })
})

    app.get("/users",(req,res)=>{
        db.collection('users').find({}).toArray()
        .then(users=>{res.send(users)})
    })

    app.get("/userbyemail/:id",(req,res)=>{
        db.collection('users').find({email:req.params.id}).toArray()
        .then(users=>{res.send(users[0])})
    })

    app.get("/users/:id",(req,res)=>{
        db.collection('users').find({uid:req.params.id})
        .toArray().then(users=>{res.send(users[0])})
    })

    app.put('/updateuser/:id',(req,res)=>{
        db.collection('users').updateOne({uid:req.params.id},{$set:req.body})
        .then(data=>res.send(data))
    })

    app.post('/setuser',(req,res)=>{
        db.collection('users').insertOne(req.body)
        .then(data=>res.send(data))
    })

    app.post('/addchat',(req,res)=>{
        db.collection('chats').insertOne(req.body)
        .then(data=>res.send(data))
    })

    app.get('/chats/:id/:id2',(req,res)=>{
        db.collection('chats').find({$or:[{p1:req.params.id,p2:req.params.id2},{p1:req.params.id2,p2:req.params.id}]}).
        toArray().then(data=>{res.send(data)})
    })

    app.get('/userlist/:id',(req,res)=>{
        db.collection('chats').find({$or:[{p1:req.params.id},{p2:req.params.id}]}).toArray().then(data=>{
          res.send(data)
        })
    })

})

server.listen(6060,()=>{console.log('io started')})