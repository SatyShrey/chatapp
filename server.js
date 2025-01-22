/* eslint-disable no-undef */

//................initialize app..........................
const express=require('express')
const app=express()
const cors=require('cors')
app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.json())
const path=require('path')
//....................bcrypt..............................
const bcrypt=require("bcrypt")
//......................socket.io..........................
const http=require('http')
const{Server}=require('socket.io')
const server=http.createServer(app)
let onlineUsers=[]
//...............allow cross origin resourse sharing.........
const io=new Server(server,{cors:{
    //origin:"https://gglchat.netlify.app"
    }});
//.................connect to socket.................
io.on('connection',(socket)=>{
   const email=socket.handshake.query.email
    socket.join(email)//join the personal room
    onlineUsers.push(email);
    io.to(email).emit('onlineUsers',onlineUsers)
    socket.broadcast.emit('online',email)//send online status
    //disconect message
    socket.on('disconnect',()=>{
        io.emit('offline',email)
        onlineUsers.pop(email)
    })
})
//............default page.....................
app.get('/',(req,res)=>{
     res.sendFile('index2.html',{root:path.join(__dirname)},(err)=>{
        if(err){console.error('Error:',err);res.end()}
        else{console.log('file sent:index2.html');res.end()}
     });
})
//...................mongodb...............................
let conStr="mongodb+srv://sndsatya:QtAy7QbfwCnzUhvu@clustersnd.adfao0n.mongodb.net"
    conStr='mongodb://127.0.0.1:27017'
const mongoClient=require('mongodb').MongoClient
mongoClient.connect(conStr).then((clientObject)=>{
    const db=clientObject.db('chatapp')
    //get all users data
    app.get('/users',(req,res)=>{
        db.collection('users').find({}).toArray().then((users)=>{res.send(users);res.end()})
    });
    //get user by id
    app.get('/user/:id',(req,res)=>{
        db.collection('users').findOne({email:req.params.id}).then((user)=>{res.send(user);res.end()})
    });
    //add user(single)
    app.post('/user', async (req,res)=>{
        var hashPassword= await bcrypt.hash(req.body.password,10)
        var newUser={
            id:req.body.id,
            name:req.body.name,
            email:req.body.email,
            password:hashPassword
        }
        db.collection('users').insertOne(newUser).then((data)=>{
            data.info="Signup success!"
            res.send(data);res.end()
        })
    });
    //login user id and password
    app.get('/login/:email/:password',(req,res)=>{
        db.collection('users').findOne({email:req.params.email}).then(async (data)=>{
            
           if(data){
            let hashPassword= await bcrypt.compare(req.params.password, data.password)
             if(hashPassword){res.send(data);res.end()}else{res.send('1');res.end()}
           }else{res.send('0');res.end()}
        })
    });
    //view chats by ids
    app.get('/chats/:email/',(req,res)=>{
        db.collection('chats').find({$or:[{p1:req.params.email},{p2:req.params.email}]})
        .toArray().then((chats)=>{res.send(chats);res.end()})
    });
    //add chat
    app.post('/chat',(req,res)=>{
        db.collection('chats').insertOne(req.body).then((data)=>{
            //send chat to receiver
            io.to(req.body.p2).emit('chat',req.body)
            res.send(data);res.end()
        })
    });
    
})
//listen to the server
const port=6060
server.listen(port,()=>{console.log(`Server started at port:${port}`)})