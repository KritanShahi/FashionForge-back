const mongoose =require('mongoose');
const dotenv=require('dotenv');

dotenv.config();


mongoose.connect('mongodb://localhost:27017/fashion_forge')
.then(()=>console.log("Connected db"))
.catch((err)=>{console.log(err)})