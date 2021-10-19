const mongoose = require('mongoose');
const Exam = mongoose.model('Exams');
const Questions = mongoose.model('Questions');



exports.updateQuestions = function(req, res, next) {
    const { title, options,answer } = req.body;
    const _id = req.params.id;
    return Questions.updateOne({_id},{ title,options,answer })
    .then(paper=> paper?res.status(200).json('question successfully updated'):res.status(500).json('no question found'))
    .catch(error=>next(error));
}

exports.deleteQuestion = function(req,res,next){
    Exam.findOne({_id:req.params.id})
    .then(async (result)=>{ 
        if(!result){
            return res.status(500).json('no paper found')
        }
        result.deleteQuestion(req.query.id);
        result.save();
        await Questions.deleteOne({_id:req.query.id})
        return res.status(200).json('deleted successfully');
    })
    .catch(err=> next(err));
}