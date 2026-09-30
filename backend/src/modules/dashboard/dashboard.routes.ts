import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import * as controller from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', authMiddleware, controller.stats);
