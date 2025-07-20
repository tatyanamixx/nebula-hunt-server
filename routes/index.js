/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 * updated by Claude on 15.07.2025
 */
const Router = require('express').Router;
const router = new Router();

const authRouter = require('./user-auth-router');
const userStateRouter = require('./user-state-router');
const galaxyRouter = require('./galaxy-router');
const artifactRouter = require('./artifact-router');

const taskRouter = require('./task-router');
const eventRouter = require('./event-router');
const upgradeRouter = require('./upgrade-router');
const packageStoreRouter = require('./package-store-router');
const marketRouter = require('./market-router');

const gameMetricsRouter = require('./game-metrics-router');
const prometheusRouter = require('./prometheus-router');

const adminRouter = require('./admin-router');
const adminUserRouter = require('./admin-user-router');

const taskTemplateRouter = require('./task-template-router');
const eventTemplateRouter = require('./event-template-router');
const upgradeTemplateRouter = require('./upgrade-template-router');
const packageTemplateRouter = require('./package-template-router');
const artifactTemplateRouter = require('./artifact-template-router');

router.use('/auth', authRouter);
router.use('/state', userStateRouter);
router.use('/galaxies', galaxyRouter);
router.use('/artifacts', artifactRouter);
router.use('/tasks', taskRouter);
router.use('/events', eventRouter);
router.use('/upgrades', upgradeRouter);
router.use('/market', marketRouter);
router.use('/packages', packageStoreRouter);

// Admin routes
router.use('/admin', adminRouter);
router.use('/task-templates', taskTemplateRouter);
router.use('/event-templates', eventTemplateRouter);
router.use('/upgrade-templates', upgradeTemplateRouter);
router.use('/package-templates', packageTemplateRouter);
router.use('/game-metrics', gameMetricsRouter);
router.use('/metrics', prometheusRouter);
router.use('/artifact-templates', artifactTemplateRouter);
router.use('/admin-users', adminUserRouter);

module.exports = router;
