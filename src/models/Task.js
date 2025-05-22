import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    date: { type: Date },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);