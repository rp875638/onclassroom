const express = require('express');
const router = express.Router();
const auth = require('../auth');

router.use('/paper', require('./paper/routes'));
router.use('/question', require('./question/routes'));
router.use('/meeting', require('./meeting/routes'));
router.use('/', require('./user/routes'));

module.exports = router;