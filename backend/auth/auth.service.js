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


const register = async (name, email, password) => {

    const existingUser = await userRepository.findUserByEmail(email);

    if (existingUser) {
        throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userRepository.createUser({
        name,
        email,
        passwordHash,
    });

    const token = jwt.sign(
        {
            userId: user._id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h',
        }
    );

    return {
        token,
    };
};

module.exports={
    login,

    register,
};