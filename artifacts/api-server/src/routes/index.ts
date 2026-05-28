import { Router, type IRouter } from "express";
import healthRouter from "./health";
import utentiRouter from "./utenti";
import contattiRouter from "./contatti";
import preventiviRouter from "./preventivi";
import agendaRouter from "./agenda";
import messaggiRouter from "./messaggi";
import dashboardRouter from "./dashboard";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(utentiRouter);
router.use(contattiRouter);
router.use(preventiviRouter);
router.use(agendaRouter);
router.use(messaggiRouter);
router.use(dashboardRouter);
router.use(webhooksRouter);

export default router;
