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
const port=6060
const io = new Server(server, { cors: { origin: origin } })

//mongodb
const mongoClient=require('mongodb').MongoClient
const conStr='mongodb+srv://sndsatya:QtAy7QbfwCnzUhvu@clustersnd.adfao0n.mongodb.net/'
mongoClient.connect(conStr).then((client)=>{
    const db=client.db('gglchats')

    app.get('/users',(req,res)=>{
        db.collection('users').find({}).toArray().then(users=>{
            if(users){res.send(users)}
        })
    })

    app.get('/user/:uid',(req,res)=>{
        db.collection('users').find({uid:req.params.uid}).toArray().then(users=>{
            if(users){res.send(users[0])}
        })
    })

    app.post('/adduser',(req,res)=>{
        db.collection('users').insertOne(req.body).then((data)=>{
            res.send(data)
        })
    })

})
//socket-io
let onlineUsers=[]
io.on('connection',(socket)=>{
    //online-user
    socket.on('online',(data)=>{
        onlineUsers.push(data)
        io.emit('onlineList',onlineUsers)
        //newMsg
        socket.on('newMsg',(data)=>{
            io.to(data.sid).emit('newMsg',data)
        })
        //disconnect
       socket.on('disconnect',()=>{
        onlineUsers=onlineUsers.filter(a=>a.uid!=data.uid)
        io.emit('onlineList',onlineUsers)
      })
    })
})

//default page
app.get('/',(req,res)=>{
    res.send('Welcome')
})


//..............listen to the server at port 6060..................
server.listen(port, () => { console.log(`server started at port:${port}`) })