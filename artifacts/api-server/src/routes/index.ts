import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paywayRouter from "./payway";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paywayRouter);

export default router;
