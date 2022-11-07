const express = require("express");
const bcrypt = require("bcryptjs")
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const app = express()
dotenv.config();
app.use((express.json({ limit: "30mb", extended: true})))
app.use((express.urlencoded({ limit: "30mb", extended: true})))
app.use((cors()))
const SECRET = "asldnassdla2113$!@#ASDASDAS"
const userSchema = new mongoose.Schema(
    { email: String, password: String, name : String , gstNo: String , mobNo : String , compName : String }
)
const User = mongoose.model('User', userSchema);
//SEND PDF INVOICE VIA EMAIL
app.get('/', (req, res) => {
    res.send('SERVER IS RUNNING')
  })
app.get('/delete',async(req,res)=>{
    try {
         await User.deleteMany()
         res.status(200).json({message: "Users Deleted"})
        } catch (error) {
            res.status(200).json({message: "Something went wrong"})
    }
})
app.put('/update-user',async(req,res)=>{
    const token = req.headers.authorization;
    const client = req.body
    try {
        if(token){
          const parseJwt = (value) => JSON.parse(Buffer.from(value.split('.')[1], 'base64').toString())
            let tokenDetails = parseJwt(token)
            const hashedPassword = await bcrypt.hash(client.password, 12)    
            client.password = hashedPassword
            const user = await User.findByIdAndUpdate({_id : tokenDetails.id}, {...client}, { new: true})
            res.json(user)
        }
        res.status(200).json( "Not Authorised" )        
    } catch (error) {
        res.status(500).json({ message: "Something went wrong"}) 
    }
})

app.get('/user', async(req,res)=>{
    try {
        const userData = await User.find()
        res.status(200).json( userData )
    } catch (error) {
        res.status(500).json({ message: "Something went wrong"}) 
    }
})  
app.post('/signup',async(req,res)=>{
    try {
        const { email, password , name } = req.body
        const existingUser = await User.findOne({ email })
        if(existingUser) return res.status(400).json({ message: "User already exist" })
        const hashedPassword = await bcrypt.hash(password, 12)
        const result = await User.create({ email,name,password:hashedPassword})
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ message: "Server did not respond"}) 
    }
})
app.post('/signin',async(req,res)=>{
    try {
        const { email, password } = req.body
        const existingUser = await User.findOne({ email })
        if(!existingUser) return res.status(400).json({message: "Credentials not match"})
        const result = await bcrypt.compare( password, existingUser.password)
        if(!result) return res.status(400).json({message: "Credentials not match"})
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, SECRET, { expiresIn: "1h" })
        existingUser.token = token;
        let data = {email:existingUser.email, id: existingUser._id ,token}
        res.status(200).json(data)
    } catch (error) {
        res.status(500).json({ message: "Server not respond"}) 
    }
})
app.post('/get-user',async(req,res)=>{
    const token = req.headers.authorization;
    try {
        if(token){
          const parseJwt = (value) => JSON.parse(Buffer.from(value.split('.')[1], 'base64').toString())
            let tokenDetails = parseJwt(token)
            res.status(200).json(tokenDetails)
        }
        res.status(200).json( "Not Authorised" )        
    } catch (error) {
        res.status(500).json({ message: "Something went wrong"}) 
    }
})

const DB_URL = "mongodb+srv://invoice:invoice123@cluster0.vwk2amk.mongodb.net/?retryWrites=true&w=majority"
const PORT = process.env.PORT || 5000

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => app.listen(PORT, () => console.log(`Server on it port: ${PORT}`)))
    .catch((error) => console.log(error.message))
