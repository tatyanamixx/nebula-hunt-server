/**
 * created by Tatyana Mikhniukevich on 30.04.2025
 */
const Router = require('express');
const router = new Router();
const authRouter = require('./auth-router');
const userStateRouter = require('./user-state-router');
const galaxyRouter = require('./galaxy-router');
const taskRouter = require('./task-router');
const upgradeRouter = require('./upgrade-router');
const eventRouter = require('./event-router');
const artifactRouter = require('./artifact-router');
const marketRouter = require('./market-router');
const adminRouter = require('./admin-router');
const metricsRouter = require('./metrics-router');
const packageTemplateRouter = require('./package-template-router');

router.use('/auth', authRouter);
router.use('/userstate', userStateRouter);
router.use('/galaxies', galaxyRouter);
router.use('/tasks', taskRouter);
router.use('/upgrades', upgradeRouter);
router.use('/events', eventRouter);
router.use('/artifacts', artifactRouter);
router.use('/market', marketRouter);
router.use('/admin', adminRouter);
router.use('/metrics', metricsRouter);
router.use('/package-templates', packageTemplateRouter);

module.exports = router;
