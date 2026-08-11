const bcrypt = require('bcryptjs');
// Bcrypt is the only one who knows how to compare a newly typed password to that scrambled hash

const jwt= require('jsonwebtoken');
const userRepository=require('./user.repository');



const login=async(email,password)=>{
    const user=await userRepository.findUserByEmail(email);

    if(!user){
        throw new Error('Invalid Email or Password')
    }


    const isPasswordValid=await bcrypt.compare(
        password, 
        user.passwordHash
    )
    if (!isPasswordValid){
        throw new Error('Invalid Email or Password')
    }

    const token =jwt.sign(

        {
            userId:user._id,
            email:user.email,
        },

        process.env.JWT_SECRET,
        {
            expiresIn:'1h',
        },


    );

 return{
    token,
 };


};

module.exports={
    login,
};