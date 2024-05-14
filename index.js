const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ["http://localhost:5173", `http://localhost:5174`,'https://assignmet-11-jwt.web.app','https://assignmet-11-jwt.firebaseapp.com'],
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

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
 

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' })
  }


  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
    req.userInfo = decode
    next()
  })
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}

async function run() {
  try {
    // // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const roomsDataCollection = client.db('Assignment11DB').collection('roomsData');
    const reviewDataCollection = client.db('Assignment11DB').collection('reviewData');
    const bookingDataCollection = client.db('Assignment11DB').collection('bookingData');


    // Auth related API 


    app.post('/jwt', async (req, res) => {
      const userEmail = req.body
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
      res.cookie('token', token, cookieOptions)
      
      res.send({ success: true })

    })

    //  clear cookies
    
    app.post('/jwt/logout', async (req, res) => {
      const userEmail = req.body;
      res.clearCookie('token', { ...cookieOptions, maxAge: 0 })

      res.send({ success: true })
    });




    //  service related API

    app.get('/rooms', async (req, res) => {
      const result = await roomsDataCollection.find().limit(6).toArray();
      res.send(result)
    })


    app.get('/all-rooms', async (req, res) => {
      const sort = req.query.sort;
      const max = parseInt(req.query.max);
      const min = parseInt(req.query.min);

      const options = {};
      if (sort === 'ase' || sort === 'dise') {
        const sortDirection = sort === 'dise' ? -1 : 1;
        options.sort = { price_per_night: sortDirection };
      }

      const filter = {};
      if (min && max) {
        filter.price_per_night = { $gte: min, $lte: max };
      }
      else if (min) {
        filter.price_per_night = { $gte: min };
      }
      else if (max) {
        filter.price_per_night = { $lte: max };
      }

      try {
        const result = await roomsDataCollection.find(filter, options).toArray();
        res.send(result);
      }
      catch (error) {
        res.status(500).json({ error: ' Server Error' });
      }
    });


    app.get('/room/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await roomsDataCollection.findOne(query);
      res.send(result)

    })


    //  insert user review  with room id  
    app.post('/review', async (req, res) => {
      const { reviewData } = req.body
      const result = await reviewDataCollection.insertOne(reviewData);
      res.send('successfully added')

    })
    


    app.get('/reviews', async (req, res) => {
      try {
        const sortKey = req.query.value;
       
    
        const options = {};
    
        if (sortKey === 'recently') {
          options.sort = { time: -1 }; 
        }
    
        const result = await reviewDataCollection.find({}, options).toArray();
        res.send(result);
      } catch (error) {
      
        res.status(500).send('Internal Server Error');
      }
    });

    // get single room  review by room id 

    app.get('/reviews/:_id', async (req, res) => {
      const _id = req.params._id;
      const query = { roomId: _id };
      const result = await reviewDataCollection.find(query).toArray();
      
      res.send(result);
    })



    // booking api 
    app.post('/booking', async (req, res) => {
      const { formDatas } = req.body
      const result = await bookingDataCollection.insertOne(formDatas);
      res.send('successfully added')


    })

// get user all booking

    app.get('/booking', verifyToken, async (req, res) => {
      const userEmail = req.query?.email
      const tokenUser = req.userInfo?.email

      if (userEmail === tokenUser) {
        // userEmail
        const query = { userEmail: tokenUser };
        const result = await bookingDataCollection.find(query).toArray();
        res.send(result)
      }
    })

    // user   booked single room  
    app.get('/booking/single', verifyToken, async (req, res) => {
      const userEmail = req.query?.userEmail
      const roomId=req.query.roomId
      const tokenUser = req.userInfo?.email
     

      if (userEmail === tokenUser) {

      //   // userEmail
      const query = { userEmail: tokenUser, roomId: roomId };
      const result = await bookingDataCollection.find(query).toArray();
      res.send(result);
      }
    })


    // update booking 

    app.put(`/update-date`,verifyToken,async (req,res)=>{
      const userEmail = req.query?.userEmail
      const tokenUser = req.userInfo?.email
      const {formData} = req.body

      if (userEmail === tokenUser) {

        const query = { _id: new ObjectId(formData.bookId) };
        const updateDoc = {
          $set: {
            arrDate: formData.arrDate,
            depDate: formData.depDate,
          }
        };
        const result = await bookingDataCollection.updateOne(query, updateDoc);
        res.send(result)
      }


    })

    // delete booking 
    app.delete('/delete', verifyToken, async (req, res) => {
      const id = req.query.id
      const userEmail = req.query?.email
      const tokenUser = req.userInfo?.email
    

      if (userEmail === tokenUser) {
        const query = { _id: new ObjectId(id) };
        const result = await bookingDataCollection.deleteOne(query);
        res.send(result)
      }
    })


    // booking update 

    app.post('/rooms/update', async (req, res) => {
      const { id } = req.body
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          availability: false
        }
      };
      const result = await roomsDataCollection.updateOne(query, updateDoc);
      res.send('successfully added')
    })

   
    app.post('/rooms/cancel', async (req, res) => {
      const { roomId } = req.body
      const query = { _id: new ObjectId(roomId) };
     
      const updateDoc = {
        $set: {
          availability: true
        }
      };
      const result = await roomsDataCollection.updateOne(query, updateDoc);
      res.send('successfully added')
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