const mongoose=require('mongoose');

const userSchema=new mongoose.Schema(

{
    name:{
        type:String,
        required:true,
        trim:true,
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },

    passwordHash:{
        type:String,
        required:true,
    },


},
{

timestamps:true,
}
// By using timestamps moongoose will automatically add createdAt and updatedAt fields to the schema 

);

module.exports= mongoose.model('User', userSchema)