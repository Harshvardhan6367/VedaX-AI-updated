import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    specialty: { type: String, required: true },
    rating: { type: Number, default: 0 },
    image: { type: String },
    nextAvailable: { type: String },
    price: { type: String },
    isVideoEnabled: { type: Boolean, default: true },
    about: { type: String },
    experience: { type: Number }, // Years
    qualifications: [{ type: String }],
    verified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
