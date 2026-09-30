import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role';
import { validate } from '../../middlewares/validate';
import * as controller from './patients.controller';
import { listPatientsQuery, patientBodySchema, patientIdParams } from './patients.schema';

export const patientsRouter = Router();

patientsRouter.use(authMiddleware);

patientsRouter.get('/', validate({ query: listPatientsQuery }), controller.list);
patientsRouter.post('/', validate({ body: patientBodySchema }), controller.create);
patientsRouter.get('/:id', validate({ params: patientIdParams }), controller.getById);
patientsRouter.put('/:id', validate({ params: patientIdParams, body: patientBodySchema }), controller.update);
patientsRouter.delete('/:id', requireRole('admin'), validate({ params: patientIdParams }), controller.remove);
