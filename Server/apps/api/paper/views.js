const mongoose = require('mongoose');
const Exam = mongoose.model('Exams');
const Questions = mongoose.model('Questions');

exports.getPaper = function(req, res, next) {
    const host = req.payload;
    Exam.findOne({ _id:req.params.id })
    .populate('questions')
    .then((papers) => {
            return res.status(200).json({ papers,  user: host });
        })
        .catch(err => next(err));
}

exports.getPapers = function(req, res, next) {
    const host = req.payload;
    Exam.find({ host }, '_id title dateTime duration totalMark').then((papers) => {
            return res.status(200).json({ papers,  user: host });
        })
        .catch(err => next(err));
}

exports.createPaper = function(req, res, next) {
    const { title, dateTime,duration,totalMark } = req.body;
    const { payload: { _id } } = req;
    try {
        const exam = new Exam({  host: _id, title,dateTime,duration,totalMark });
        exam.save();
        return res.status(200).json({ exam, user: req.user });
    } catch (err) {
        next(err)
    };

}

exports.updatePaper = function(req, res, next) {
    const { title, dateTime,duration,totalMark } = req.body;
    const _id = req.params.id;
    return Exam.updateOne({_id},{ title,dateTime,duration,totalMark })
    .then(paper=> paper?res.status(200).json('paper successfully updated'):res.status(500).json('no paper found'))
    .catch(error=>next(error));
}

exports.deletePaper = function(req,res,next){
    Exam.deleteOne({_id:req.params.id})
    .then(result=> result?res.status(200).json({ result }):res.status(500).json('no paper found'))
    .catch(err=> next(err));
}

exports.addQuestions = function(req, res, next) {
    const _id = req.params.id;
    try {
        Exam.findById(_id)
        .then(paper=>{
            const question = new Questions(req.body);
            question.save();
            paper.addQuestion(question._id);
            paper.save();
            return res.status(200).json({ question, user: req.user });
        })        
    } catch (err) {
        next(err)
    };

}