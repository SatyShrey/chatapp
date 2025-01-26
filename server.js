
//................initialize app..........................
const express=require('express')
const app=express()
const cors=require('cors')
app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.json())
const path=require('path');
const multer = require('multer');
//....................bcrypt..............................
const bcrypt=require("bcrypt")
//......................socket.io..........................
const http=require('http')
const{Server}=require('socket.io')
const server=http.createServer(app)
let onlineUsers=[]
let conStr="mongodb+srv://sndsatya:QtAy7QbfwCnzUhvu@clustersnd.adfao0n.mongodb.net"
    //conStr='mongodb://127.0.0.1:27017'
//...............allow cross origin resourse sharing.........
const io=new Server(server,{cors:{
    //origin:"https://gglchat.netlify.app"
    }});

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
      cb(null, "Hi"+file.originalname.replace(path.extname(file.originalname),'') +""+ Date.now() + path.extname(file.originalname));
    }
  });
// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Limit file size to 1MB
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  }).single('photo');
  // Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
  
  //dodnload the photo
  // Serve the uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to download a photo
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
      res.end()
    }
  });
});
//............default page.....................
app.get('/',(req,res)=>{
     res.sendFile('index2.html',{root:path.join(__dirname)},(err)=>{
        if(err){console.error('Error:',err);res.end()}
        else{console.log('file sent:index2.html');res.end()}
     });
})
//...................mongodb...............................
const mongoClient=require('mongodb').MongoClient;
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
    //get all secondary users
    app.get('/users/:id',(req,res)=>{
        db.collection('users').find({$nor:[{email:req.params.id}]}).toArray().then((users)=>{res.send(users);res.end()})
    });
    //add user(single)
    app.post('/user', async (req,res)=>{
        var hashPassword= await bcrypt.hash(req.body.password,10)
        var newUser={
            id:req.body.id,
            name:req.body.name,
            email:req.body.email,
            password:hashPassword,
            pic:req.body.pic
        }
        db.collection('users').insertOne(newUser).then((data)=>{
            data.info="Signup success. You can login now!"
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
    
})

//.................connect to socket.................
io.on('connection',(socket)=>{
    const userId = socket.handshake.query.userId;
    
  // Emit the list of all rooms to the newly connected user
    socket.emit('roomList', Array.from(io.sockets.adapter.rooms.keys()));

    socket.join(userId);
    // Broadcast the updated room list to all users when a new room is created
    io.emit('roomList', Array.from(io.sockets.adapter.rooms.keys()));

    mongoClient.connect(conStr).then((clientObject)=>{
        const db=clientObject.db('chatapp')
        //add chat
       app.post('/chat',(req,res)=>{
        db.collection('chats').insertOne(req.body).then((data)=>{
            //send chat to receiver
            io.to(req.body.p2).emit('message', req.body);
            res.send(req.body);res.end()
        })
    });
    })

    // Route to upload photo
  app.post('/upload/:p1/:p2', (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        res.send(err);
      } else {
        if (req.file == undefined) {
          res.send('Error: No File Selected!');
        } else {
          res.send(`File Uploaded: ${req.file.filename}`);
          const body={p1:req.params.p1,p2:req.params.p2,file:req.file.filename}
          //send chat to receiver
          io.to(req.params.p2).emit('message', body);
          io.to(req.params.p1).emit('returnme', body);
          //add image chat
          mongoClient.connect(conStr).then((clientObject)=>{
            const db=clientObject.db('chatapp')
            db.collection('chats').insertOne(body).then((data)=>{
                res.end()
            })
        })
        }
      }
    });
  });

   // Broadcast the updated user list to all users when a user disconnects
  socket.on('disconnect', () => {
    io.emit('roomList', Array.from(io.sockets.adapter.rooms.keys()));
  });
})

//set profile pic
app.post('/setprofilepic',(req,res)=>{
  upload(req, res, (err) => {
    if (err) {
      res.send(err.message);
    } else {
      if (req.file == undefined) {
        res.send('Error: No File Selected!');
      } else {
        res.send({result:'success',file:req.file.filename})
      }
    }
  });
})
//listen to the server
const port=6060
server.listen(port,()=>{console.log(`Server started at port:${port}`)})