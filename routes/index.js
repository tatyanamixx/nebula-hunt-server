const Router = require('express');
const router = new Router();

// Import route modules
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const galaxyRoutes = require('./galaxyRoutes');
const userStateRoutes = require('./userStateRoutes');
const taskRoutes = require('./taskRoutes');
const achievementRoutes = require('./achievementRoutes');
const eventRoutes = require('./eventRoutes');

// Use route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/galaxies', galaxyRoutes);
router.use('/user/state', userStateRoutes);
router.use('/tasks', taskRoutes);
router.use('/achievements', achievementRoutes);
router.use('/events', eventRoutes);

module.exports = router;
