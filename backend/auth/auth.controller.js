const authService = require('./auth.service');


// req(request) contains everything the user sent us 
// res(response) this is the loud speaker that we use to send information back to the user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);
    // waits till the security manager finish checking and printing the token

    return res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return res.status(401).json({
      message: error.message,
    });
  }
};

const register = async (req, res) => {
  try {

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required',
      });
    }

    const result = await authService.register(
      name,
      email,
      password,
      role
    );

    return res.status(201).json({
      message: 'Registration successful',
      token: result.token,
      user: result.user,
    });

  } catch (error) {

    return res.status(400).json({
      message: error.message,
    });

  }
};




// GET /api/auth/me - who is holding this token.
const me = async (req, res) => {
  try {
    return res.json(await authService.getUserById(req.user.userId));
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

// GET /api/auth/users?role=staff - directory so an organizer can pick people to add.
// Organizers only: this hands out other people's names and emails.
const listUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can browse users' });
    }
    const { role, q } = req.query;
    return res.json({ items: await authService.listUsers({ role, q }) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  register,
  me,
  listUsers,
};