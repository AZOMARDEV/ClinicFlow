import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as controller from './auth.controller';
import { loginSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema }), controller.login);
authRouter.get('/me', authMiddleware, controller.me);
