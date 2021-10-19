const express = require('express');
const router = express.Router();

router.use('/api', require('./api/routes'));
router.use('/users', require('./user/routes'));
router.use('/meeting', require('./meetiing/routes'));
router.use('/', require('./homepage/routes'));
module.exports = router;