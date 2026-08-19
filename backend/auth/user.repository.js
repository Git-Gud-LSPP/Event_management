const User = require('./user.model');

const findUserByEmail = async (email) => {
    return User.findOne({ email });
};

const createUser = async (userData) => {
    return User.create(userData);
};

module.exports = {
    findUserByEmail,
    createUser,
};