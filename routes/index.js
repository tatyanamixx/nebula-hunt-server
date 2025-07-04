const Router = require('express').Router;
const router = new Router();

// Import route modules
const authRouter = require('./auth-router');
const adminRouter = require('./admin-router');
const galaxyRouter = require('./galaxy-router');
const userStateRouter = require('./user-state-router');
const upgradeRouter = require('./upgrade-router');
const eventRouter = require('./event-router');
const taskRouter = require('./task-router');
const marketRouter = require('./market-router');
const artifactRouter = require('./artifact-router');
const metricsRouter = require('./metrics-router');
const prometheusMiddleware = require('../middlewares/prometheus-middleware');

// Use route modules
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/galaxy', galaxyRouter);
router.use('/state', userStateRouter);
router.use('/upgrades', upgradeRouter);
router.use('/events', eventRouter);
router.use('/tasks', taskRouter);
router.use('/market', marketRouter);
router.use('/artifact', artifactRouter);
router.use('/game-metrics', metricsRouter);
router.use('/', prometheusMiddleware);

module.exports = router;
