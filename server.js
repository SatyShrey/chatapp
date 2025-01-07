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
const origin = 'https://whatchat.netlify.app'
//const origin="http://localhost:5173"
const io = new Server(server, { cors: { origin: origin } })
let list=[]

io.on('connection',(socket)=>{
    socket.on('newMsg',(newObj)=>{
      io.to(newObj.id).emit('newMsg',newObj)
    })

   socket.on('username',(data)=>{
    list=list.filter(a=>a.user!=data.user)
    list.push({id:data.id,user:data.user})
    io.emit('onlineusers',list)

    socket.on('disconnect',()=>{
        list=list.filter(a=>a.user!=data.user)
        io.emit('onlineusers',list)
       })
   })
   
})

app.get('/',(req,res)=>{
    res.send('Welcome')
})

//..............listen to the server at port 6060..................
server.listen(6060, () => { console.log('io started:6060') })