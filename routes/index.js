const Router = require('express').Router;
const router = new Router();

// Import route modules
const authRouter = require('./auth-router');
const adminRouter = require('./admin-router');
const galaxyRouter = require('./galaxy-router');
const userStateRouter = require('./user-state-router');
const upgradeRouter = require('./upgrade-router');
const achievementRouter = require('./achievement-router');
const eventRouter = require('./event-router');

// Use route modules
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/galaxy', galaxyRouter);
router.use('/state', userStateRouter);
router.use('/upgrades', upgradeRouter);
router.use('/achievements', achievementRouter);
router.use('/events', eventRouter);

module.exports = router;
