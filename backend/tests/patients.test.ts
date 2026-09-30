import request from 'supertest';
import { app, createUser, pool, resetDb } from './helpers';

let token: string;

beforeAll(async () => {
  await resetDb();
  ({ token } = await createUser('staff'));
});
afterAll(() => pool.end());

const create = (fullName: string, cin: string) =>
  request(app)
    .post('/api/patients')
    .set('Authorization', `Bearer ${token}`)
    .send({ fullName, cin, phone: '0661234567', birthDate: '1990-05-01' });

describe('patients', () => {
  it('searches by name or CIN and paginates with the right total', async () => {
    for (let i = 1; i <= 12; i++) {
      expect((await create(`Amina Search ${i}`, `SR${String(i).padStart(4, '0')}`)).status).toBe(201);
    }
    await create('Other Person', 'ZZ9999');

    const page2 = await request(app)
      .get('/api/patients?search=search&page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect(page2.status).toBe(200);
    expect(page2.body).toMatchObject({ page: 2, limit: 5, total: 12, totalPages: 3 });
    expect(page2.body.data).toHaveLength(5);

    const byCin = await request(app).get('/api/patients?search=zz99').set('Authorization', `Bearer ${token}`);
    expect(byCin.body.total).toBe(1);
    expect(byCin.body.data[0].cin).toBe('ZZ9999');
  });

  it('returns 409 for a duplicate CIN and 400 for invalid input', async () => {
    expect((await create('First Holder', 'DUP1234')).status).toBe(201);
    const dup = await create('Second Holder', 'dup1234');
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CIN_ALREADY_EXISTS');

    const invalid = await create('X', '!!');
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });
});
