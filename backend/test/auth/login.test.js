require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('should login with valid credentials and return a valid JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    // Check that login was successful
    expect(response.statusCode).toBe(200);

    // Check that a token was returned
    expect(response.body).toHaveProperty('token');

    // Verify that the returned token is a valid JWT
    const decoded = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET
    );

    // Check the information stored inside the JWT
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email', 'test@example.com');
  });
});