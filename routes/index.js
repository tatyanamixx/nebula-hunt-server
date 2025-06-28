const Router = require('express').Router;
const router = new Router();

// Import route modules
const authRouter = require('./auth-router');
const adminRouter = require('./admin-router');
const galaxyRouter = require('./galaxy-router');
const userStateRouter = require('./user-state-router');
const stateHistoryRouter = require('./state-history-router');
const upgradeRouter = require('./upgrade-router');
const eventRouter = require('./event-router');
const taskRouter = require('./task-router');

// Use route modules
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/galaxy', galaxyRouter);
router.use('/state', userStateRouter);
router.use('/history', stateHistoryRouter);
router.use('/upgrades', upgradeRouter);
router.use('/events', eventRouter);
router.use('/tasks', taskRouter);

module.exports = router;
