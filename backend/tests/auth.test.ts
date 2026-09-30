import request from 'supertest';
import { app, createPatient, createUser, pool, resetDb, PASSWORD } from './helpers';

beforeAll(resetDb);
afterAll(() => pool.end());

describe('auth', () => {
  it('logs in with valid credentials and rejects a wrong password with 401', async () => {
    const { email } = await createUser('staff', 'login@test.dev');

    const ok = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));
    expect(ok.body.user).toMatchObject({ email, role: 'staff' });
    expect(ok.body.user.passwordHash).toBeUndefined();

    const wrong = await request(app).post('/api/auth/login').send({ email, password: 'nope' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');

    // Unknown email gets the exact same response
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'nope' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  it('requires a token on protected routes', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });
});

describe('roles', () => {
  it('forbids staff from deleting a patient (403) and lets an admin do it (204)', async () => {
    const staff = await createUser('staff');
    const admin = await createUser('admin');
    const patientId = await createPatient();

    const asStaff = await request(app).delete(`/api/patients/${patientId}`).set('Authorization', `Bearer ${staff.token}`);
    expect(asStaff.status).toBe(403);

    const asAdmin = await request(app).delete(`/api/patients/${patientId}`).set('Authorization', `Bearer ${admin.token}`);
    expect(asAdmin.status).toBe(204);

    const after = await request(app).get(`/api/patients/${patientId}`).set('Authorization', `Bearer ${admin.token}`);
    expect(after.status).toBe(404);
  });
});
