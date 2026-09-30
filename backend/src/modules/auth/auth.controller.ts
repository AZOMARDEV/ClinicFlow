import type { Request, Response } from 'express';
import * as authService from './auth.service';
import type { LoginInput } from './auth.schema';

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.validated!.body as LoginInput);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);
  res.json({ user });
}
