import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Add bcrypt later if auth is implemented
    age: { type: Number },
    gender: { type: String },
    bloodGroup: { type: String },
    role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
    // Optional detailed fields
    medicalHistory: { type: String },
    allergies: [{ type: String }],
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String }
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
