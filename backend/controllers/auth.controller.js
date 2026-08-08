const authService = require('../services/auth.service');


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
    });
  } catch (error) {
    return res.status(401).json({
      message: error.message,
    });
  }
};

module.exports = {
  login,
};