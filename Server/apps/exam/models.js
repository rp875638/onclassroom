const mongoose = require('mongoose');
const Questions = mongoose.model('Questions');
const { Schema } = mongoose;

const ExamSchema = new Schema({
    host: { requied: true, type: Schema.Types.ObjectId, ref: 'Users' },
    title: { type: String, required: true},
    dateTime: { type: Date, require: true },
    duration: { type: Number, require: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Questions' }],
    totalMark: { type: Number, required: true },
});

    ExamSchema.methods.addQuestion = function(id){
        this.questions.push(id);
    }
    ExamSchema.pre('deleteOne',()=>{
        Questions.deleteMany({_id:this.questions});
    });

    ExamSchema.pre('remove',{ document: true,query: false },()=>{
        Questions.deleteOne({_id:this.questions});
    });

    ExamSchema.methods.deleteQuestion = function(id){
        this.questions.pull(id);
    }

mongoose.model('Exams', ExamSchema);