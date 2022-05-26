const express = require('express')
const cors = require('cors')
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());




const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization
    if(authorization){
        const accessToken = authorization.split(" ")[1];

        jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
            if(err){
                return res.status(403).send({message:"Forbidden Access from verifyToken"})
            }
            req.decoded = decoded;
            next();
        })
    }else{
        return res.status(401).send({message:"Unauthorised"})
    }
}

// DB CONNECTION
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@doctorportal.tp7ce.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const connectDB = async () => {

    try {

        await client.connect();
        const toolsCollection = client.db("robolab").collection("tools");
        const ordersCollection = client.db("robolab").collection("orders");
        const usersCollection = client.db("robolab").collection("users");
        const reviewsCollection = client.db("robolab").collection("reviews");

        
        // middleware
        // verifyADmin

        const verifyAdmin = async (req, res, next) => {

            const requester = req.decoded.email;

            const requesterUser = await usersCollection.findOne({ email: requester });

            if (requesterUser.role === 'admin') {
                next()
            }
            else {
                res.status(403).send({ message: "Forbidden Access VerifyADmin" })
            }
        }






        // asign token and send

        app.put("/updateuser",async (req, res)=>{
            const user = req.body;
            const email = user.email
            const filter = {email:email}
            
            const options = {
                upsert:true,
            }

            const updateDoc = {
                $set:user,
            }

            const result = await usersCollection.updateOne(filter, updateDoc,options)

            // create token for this user
            const token = jwt.sign({email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})

            res.send({result,token:token})
           
        })
        
        // get all tools
        app.get('/tools', async (req, res) => {
            const tools = await toolsCollection.find({}).toArray();
            res.send(tools);
        })

        // get single tool by id
        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const filter ={
                _id:ObjectId(id)
            }
            const tool = await toolsCollection.findOne(filter);
            res.send(tool)
        })



        // place order
        app.post('/order', verifyToken, async (req, res) => {
            const order = req.body;
         
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        })


        // get all orders from admin

        app.get('/all-orders', verifyToken,verifyAdmin, async (req, res) => {

                const filter = {}
                const orders = await ordersCollection.find(filter).toArray();
                res.send(orders)
        })

        // get orders filter by user
        app.get('/my-orders/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const filter = {
                user:email
            }
            const orders = await ordersCollection.find(filter).toArray();
            res.send(orders);

        })

        // delete an order
        app.delete('/order/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id:ObjectId(id)
            }
            try{

                const result = await ordersCollection.deleteOne(filter);
                res.send(result);

            }
            catch(err) {
                res.send({error:true})
                
            }
        })

        // add review

        app.post('/review',verifyToken, async (req, res) => {
            const  review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result)
        })

        // get all reviews
        app.get('/reviews', async (req, res) => {

            const reviews = await reviewsCollection.find({}).toArray();
            res.send(reviews);

        })


        // get all users
        app.get('/allusers',verifyToken,verifyAdmin,async (req, res) => {
            const users = await usersCollection.find({}).toArray();
            res.send(users)

        })
        // get single user details
        app.get('/profile/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const filter = {
                email:email
            }
            const user = await usersCollection.findOne(filter);

            res.send(user);
        })

        // update profile
        app.put('/updateprofile/:email', verifyToken, async (req, res) => {
            const profile = req.body;
            const email = req.params.email;
            const filter = {email:email};

            const options ={
                upsert: true,
            }
            const updateDoc = {
                $set:profile,
            }

            const result = await usersCollection.updateOne(filter,updateDoc,options);
            res.send({result})
        })
       

    }

    catch (err) {
        console.error(err);
    }


}

connectDB().catch(console.dir);


app.get("/",(req,res)=>{
    res.send("Working well RoboLab")
})


app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`)
})