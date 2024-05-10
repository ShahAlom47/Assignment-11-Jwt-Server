const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ["http://localhost:5173", `http://localhost:5173`],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}
))
app.use(express.json());
app.use(cookieParser())



;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r31xce1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken=(req,res,next)=>{
  const token= req.cookies.token;
// console.log('tok tok ',req.cookies.token);

if(!token){
  return res.status(401).send({message:'Unauthorized Access'})
}


jwt.verify(token,process.env.ACCESS_TOKEN,(err,decode)=>{
  if(err){
    return res.status(403).send({message:'Forbidden Access'})
  }
req.userInfo=decode
next()
}) 
}

async function run() {
  try {
    // // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const fakeDataCollection = client.db('Assignment11DB').collection('fakeData');
    const roomsDataCollection = client.db('Assignment11DB').collection('roomsData');

 app.get ('/fakeData',async(req,res)=>{
  const doc = {
    title: "Record of a Shriveled Datum",
    content: "No bytes, no problem. Just insert a document, in MongoDB",
  }
  
  const result = await fakeDataCollection.insertOne(doc);
  res.send(result)
 }) 


 app.get ('/rooms',async(req,res)=>{
  const result = await roomsDataCollection.find().limit(6).toArray();
  res.send(result)
 }) 


 app.get ('/all-rooms',async(req,res)=>{
  const sort= req.query.sort
  
  
  
  const options={};
  // if (sort ==='ase' || sort == 'dise') {
  //   const sortDirection = req.query.sort === 'dise' ? -1 : 1;

  //   options.sort = { price_per_night: sortDirection };
  // }
  const result = await roomsDataCollection.find({},options).toArray();
 
 console.log(options);
  res.send(result)
 }) 











    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Assignment-11 Stating')
})

app.listen(port, () => {
  console.log(`Assignment-11 server is running on port: ${port}`);
})