const mongoose = require('mongoose');

const { Schema } = mongoose;

const QuestionsSchema = new Schema({
    title: { type: String, required: true},
    answer: { type: String, require: true },
    options: [{ type: String, required:true }],
});

mongoose.model('Questions', QuestionsSchema);