const User = require("./user.model");

const findUserByEmail = async (email) => {
  return User.findOne({ email });
};

const createUser = async (userData) => {
  return User.create(userData);
};

const findUserById = async (id) => {
  return User.findById(id);
};

// Directory lookup so an organizer can pick who to add to an event.
const findUsers = async ({ role, q } = {}) => {
  const query = {};
  if (role) query.role = role;
  if (q) query.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  return User.find(query).select("name email role").sort({ name: 1 }).limit(100);
};

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  findUsers,
};
