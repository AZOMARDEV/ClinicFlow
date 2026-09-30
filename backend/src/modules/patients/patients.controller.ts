import type { Request, Response } from 'express';
import * as patientsService from './patients.service';
import type { ListPatientsQuery, PatientInput } from './patients.schema';

type IdParams = { id: string };

export async function list(req: Request, res: Response) {
  res.json(await patientsService.list(req.validated!.query as ListPatientsQuery));
}

export async function getById(req: Request, res: Response) {
  const { id } = req.validated!.params as IdParams;
  res.json(await patientsService.getById(id));
}

export async function create(req: Request, res: Response) {
  const patient = await patientsService.create(req.validated!.body as PatientInput);
  res.status(201).json(patient);
}

export async function update(req: Request, res: Response) {
  const { id } = req.validated!.params as IdParams;
  res.json(await patientsService.update(id, req.validated!.body as PatientInput));
}

export async function remove(req: Request, res: Response) {
  const { id } = req.validated!.params as IdParams;
  await patientsService.remove(id);
  res.status(204).end();
}
