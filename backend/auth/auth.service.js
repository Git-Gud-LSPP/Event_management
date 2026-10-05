const bcrypt = require('bcryptjs');
// Bcrypt is the only one who knows how to compare a newly typed password to that scrambled hash

const jwt= require('jsonwebtoken');
const userRepository=require('./user.repository');



// Never let passwordHash leave this layer.
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});


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
            role:user.role,
        },

        process.env.JWT_SECRET,
        {
            expiresIn:'1h',
        },


    );

 return{
    token,
    user: publicUser(user),
 };


};


const register = async (name, email, password, role) => {

    const existingUser = await userRepository.findUserByEmail(email);

    if (existingUser) {
        throw new Error('User already exists');
    }

    if (role && !['organizer', 'staff'].includes(role)) {
        throw new Error('Role must be organizer or staff');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userRepository.createUser({
        name,
        email,
        passwordHash,
        ...(role ? { role } : {}),
    });

    const token = jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h',
        }
    );

    return {
        token,
        user: publicUser(user),
    };
};

const getUserById = async (id) => {
    const user = await userRepository.findUserById(id);
    if (!user) throw new Error('User not found');
    return publicUser(user);
};

const listUsers = async ({ role, q } = {}) => {
    const users = await userRepository.findUsers({ role, q });
    return users.map(publicUser);
};

module.exports={
    login,

    register,
    getUserById,
    listUsers,
};