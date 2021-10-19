const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const views = require('./views');

router.put('/:id',auth.required,views.updateQuestions);
router.delete('/:id',auth.required,views.deleteQuestion);
module.exports = router;