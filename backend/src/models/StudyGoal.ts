import { Schema, model, Types } from 'mongoose';

// A study goal planned for one calendar day. `date` is the student's LOCAL date
// ("YYYY-MM-DD"), stored as a string on purpose: a UTC timestamp could shift the
// goal to the neighbouring day depending on timezone.
const studyGoalSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studyGoalSchema.index({ user: 1, date: 1 });

export const StudyGoal = model('StudyGoal', studyGoalSchema);
export default StudyGoal;
