
const express=require("express")
const app=express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
const cors=require("cors")
app.use(cors())

const mongoClient=require("mongodb").MongoClient
const conStr="mongodb://127.0.0.1:27017"


app.get('/',(req,res)=>{
    res.send("Hi Satya.")
})

mongoClient.connect(conStr).then(clientObject=>{
    var db=clientObject.db('gglchats')

    app.get("/users",(req,res)=>{
        db.collection('users').find({}).toArray()
        .then(users=>{res.send(users)})
    })

    app.get("/users/:id",(req,res)=>{
        db.collection('users').find({email:req.params.id})
        .toArray().then(users=>{res.send(users[0])})
    })

    app.put('/updateuser/:id',(req,res)=>{
        const fil={email:req.params.id}
        db.collection('users').updateOne(fil,{$set:req.body})
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
        db.collection('chats').find({p1:req.params.id},{p2:req.params.id}).toArray().then(data=>{
            let a=[]
           data.map(d=>{if(d.p1===req.params.id){a.push(d.p2)}else{a.push(d.p1)}})
           let b=[...new Set(a)]
           res.send(b)
        })
    })

})



app.listen(6060,()=>{console.log("Started")})