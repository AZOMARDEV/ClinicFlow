import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as controller from './appointments.controller';
import {
  appointmentIdParams,
  createAppointmentSchema,
  listAppointmentsQuery,
  updateStatusSchema,
} from './appointments.schema';

export const appointmentsRouter = Router();

appointmentsRouter.use(authMiddleware);

appointmentsRouter.get('/', validate({ query: listAppointmentsQuery }), controller.list);
appointmentsRouter.post('/', validate({ body: createAppointmentSchema }), controller.create);
appointmentsRouter.patch(
  '/:id/status',
  validate({ params: appointmentIdParams, body: updateStatusSchema }),
  controller.updateStatus,
);
