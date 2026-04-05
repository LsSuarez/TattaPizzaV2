import { Router, type IRouter } from "express";
import healthRouter from "./health";
import menuRouter from "./menu";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import statsRouter from "./stats";
import webhookRouter from "./webhook";
import portalRouter from "./portal";
import guestRouter from "./guest";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(menuRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(statsRouter);
router.use(webhookRouter);
router.use("/portal", portalRouter);
router.use(guestRouter);
router.use("/portal", paymentsRouter);

export default router;
