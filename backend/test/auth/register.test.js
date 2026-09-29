require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../../app');

describe('POST /api/auth/register', () => {

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('should register a new user and return a valid JWT', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: `user${Date.now()}@test.com`,
        password: 'password123',
      });

    // Registration should succeed
    expect(response.statusCode).toBe(201);

    // Response should contain a token
    expect(response.body).toHaveProperty('token');

    // Verify that the returned token is a valid JWT
    const decoded = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET
    );

    // Check the information stored inside the JWT
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
  });
});