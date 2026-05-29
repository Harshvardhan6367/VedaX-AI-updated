import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, required: true },
    doctorName: { type: String },
    url: { type: String },
    fileData: { type: String } // Storing base64 strings directly for prototype
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
