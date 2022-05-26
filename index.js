const express = require('express')
const cors = require('cors')
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());




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
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result)
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