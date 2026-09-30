import request from 'supertest';
import { app, createPatient, createUser, futureIso, pool, resetDb } from './helpers';

let token: string;

beforeAll(async () => {
  await resetDb();
  ({ token } = await createUser('staff'));
});
afterAll(() => pool.end());

const book = (patientId: string, appointmentDate: string, status: string) =>
  request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${token}`)
    .send({ patientId, appointmentDate, reason: 'Check-up', status });

describe('30-minute rule for confirmed appointments', () => {
  it('rejects a second confirmed appointment 15 minutes later with 409', async () => {
    const patientId = await createPatient();
    expect((await book(patientId, futureIso(2, 10, 0), 'confirmed')).status).toBe(201);

    const res = await book(patientId, futureIso(2, 10, 15), 'confirmed');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'APPOINTMENT_CONFLICT',
      message: 'Patient already has a confirmed appointment within 30 minutes',
    });
  });

  it('accepts two confirmed appointments exactly 30 minutes apart', async () => {
    const patientId = await createPatient();
    expect((await book(patientId, futureIso(3, 10, 0), 'confirmed')).status).toBe(201);
    expect((await book(patientId, futureIso(3, 10, 30), 'confirmed')).status).toBe(201);
  });

  it('accepts a pending appointment within 30 minutes of a confirmed one', async () => {
    const patientId = await createPatient();
    expect((await book(patientId, futureIso(4, 10, 0), 'confirmed')).status).toBe(201);
    expect((await book(patientId, futureIso(4, 10, 10), 'pending')).status).toBe(201);
  });

  it('applies the rule when a pending appointment is confirmed', async () => {
    const patientId = await createPatient();
    await book(patientId, futureIso(5, 9, 0), 'confirmed');
    const pending = await book(patientId, futureIso(5, 9, 20), 'pending');

    const res = await request(app)
      .patch(`/api/appointments/${pending.body.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(409);
  });

  it('does not block other patients', async () => {
    const a = await createPatient();
    const b = await createPatient();
    expect((await book(a, futureIso(6, 11, 0), 'confirmed')).status).toBe(201);
    expect((await book(b, futureIso(6, 11, 0), 'confirmed')).status).toBe(201);
  });
});
