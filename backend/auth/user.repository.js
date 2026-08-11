const User = require('./user.model')

const findUserByEmail =async(email)=>{
    return User.findOne({email})
};

module.exports={
    findUserByEmail
}

// Exporting the newly built search tool so the rest of the app can use it
