import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  notes?: string;
  status: 'PROPOSED' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'COMPLETE' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  project: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['PROPOSED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETE', 'ON_HOLD'], default: 'PROPOSED' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  dueDate: { type: Date },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
