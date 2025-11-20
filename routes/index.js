/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 * updated by Claude on 15.07.2025
 */
const Router = require("express").Router;
const router = new Router();

const authRouter = require("./user-auth-router");
const userStateRouter = require("./user-state-router");
const galaxyRouter = require("./galaxy-router");
const artifactRouter = require("./artifact-router");

const taskRouter = require("./task-router");
const eventRouter = require("./event-router");
const upgradeRouter = require("./upgrade-router");
const packageStoreRouter = require("./package-store-router");
const marketRouter = require("./market-router");
const gameRouter = require("./game-router");
const referralRouter = require("./referral-router");
const reminderRouter = require("./reminder-router");

const gameMetricsRouter = require("./game-metrics-router");
const prometheusRouter = require("./prometheus-router");

const adminRouter = require("./admin-router");
const adminUserRouter = require("./admin-user-router");
const passwordResetRouter = require("./password-reset-router");

const taskTemplateRouter = require("./task-template-router");
const eventTemplateRouter = require("./event-template-router");
const upgradeTemplateRouter = require("./upgrade-template-router");
const packageTemplateRouter = require("./package-template-router");
const artifactTemplateRouter = require("./artifact-template-router");
const templateViewRouter = require("./template-view-router");
const commissionTemplateRouter = require("./commission-template-router");

router.use("/auth", authRouter);
router.use("/state", userStateRouter);
router.use("/galaxies", galaxyRouter);
router.use("/artifacts", artifactRouter);
router.use("/tasks", taskRouter);
router.use("/events", eventRouter);
router.use("/upgrades", upgradeRouter);
router.use("/market", marketRouter);
router.use("/packages", packageStoreRouter);
router.use("/game", gameRouter);
router.use("/referral", referralRouter);
router.use("/users", reminderRouter);

// Admin routes
router.use("/admin", adminRouter);
router.use("/admin/password-reset", passwordResetRouter);
router.use("/task-templates", taskTemplateRouter);
router.use("/event-templates", eventTemplateRouter);
router.use("/upgrade-templates", upgradeTemplateRouter);
router.use("/package-templates", packageTemplateRouter);
router.use("/game-metrics", gameMetricsRouter);
router.use("/metrics", prometheusRouter);
router.use("/artifact-templates", artifactTemplateRouter);
router.use("/commission-templates", commissionTemplateRouter);
router.use("/admin-users", adminUserRouter);
router.use("/template-views", templateViewRouter);

module.exports = router;
