import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    notes: { type: String },
    type: { type: String, enum: ['video', 'in-person'], default: 'video' },
    status: { type: String, enum: ['upcoming', 'completed', 'cancelled', 'pending'], default: 'upcoming' },
    diagnosis: { type: String },
    prescription: [{ type: String }],
    userRating: { type: Number },
    userReview: { type: String }
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
