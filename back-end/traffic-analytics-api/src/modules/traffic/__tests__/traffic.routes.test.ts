/**
 * test for api traffic
 */

import request from 'supertest';
import app from '../../../app';

jest.mock('../traffic.service');

describe('GET /api/traffic/by-country', () => {
  it('returns 400 when "year" is missing', async () => {
    const res = await request(app).get('/api/traffic/by-country');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
