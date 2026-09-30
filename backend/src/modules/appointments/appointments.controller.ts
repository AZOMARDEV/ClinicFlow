import type { Request, Response } from 'express';
import * as appointmentsService from './appointments.service';
import type { AppointmentStatus, CreateAppointmentInput, ListAppointmentsQuery } from './appointments.schema';

export async function create(req: Request, res: Response) {
  const appointment = await appointmentsService.create(req.validated!.body as CreateAppointmentInput, req.user!.id);
  res.status(201).json(appointment);
}

export async function list(req: Request, res: Response) {
  const data = await appointmentsService.list(req.validated!.query as ListAppointmentsQuery);
  res.json({ data });
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.validated!.params as { id: string };
  const { status } = req.validated!.body as { status: AppointmentStatus };
  res.json(await appointmentsService.updateStatus(id, status));
}
