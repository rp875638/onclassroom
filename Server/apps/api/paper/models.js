const mongoose = require('mongoose');
const Questions = mongoose.model('Questions');
const { Schema } = mongoose;
const QuestionSchema = Schema({
    title: {type:String,requied:true},
    answer:{type:String,required:true},
    options:[{type:String,required:true}]
})

const TestSchema = new Schema({
    studentId : {required:true,type: Schema.Types.ObjectId, ref:'Users'},
    questions: [{
                    questionId:{ required: true, type: String},
                    attempted:{ required: true, type:Boolean},
                    answer: { type: String }
                }],
    score: { type: Number}
})

const PaperSchema = new Schema({
    host: { requied: true, type: Schema.Types.ObjectId, ref: 'Users' },
    title: { type: String, required: true},
    dateTime: { type: Date, require: true },
    duration: { type: Number, require: true },
    questions: [QuestionSchema],
    test: [TestSchema],
    totalMark: { type: Number, required: true },
});

PaperSchema.methods.addQuestion = function(question){
    this.questions.push(question);
}

PaperSchema.methods.removeQuestion = function(_id){
    this.questions.pull(_id);
}

PaperSchema.methods.createTest = function(studentId){
    this.test.push({studentId});
}

PaperSchema.methods.answerQuestion = function(_id,questionId,answer){
    this.test.id(_id).questions.push({questionId,attempted:true,answer});
}

PaperSchema.methods.attemptQuestion = function(_id,questionId,answer){
    this.test.id(_id).questions.id();
}

mongoose.model('Exams', ExamSchema);