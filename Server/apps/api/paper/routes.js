const express = require('express');
const router = express.Router();
const auth = require('../../auth');
const views = require('./views');


router.get('/',auth.required,views.getPapers);
router.get('/:id',auth.required,views.getPaper);
router.post('/',auth.required,views.createPaper);
router.put('/:id',auth.required,views.updatePaper);
router.delete('/:id',auth.required,views.deletePaper);
router.put('/add/:id',auth.required,views.addQuestions);
module.exports = router;