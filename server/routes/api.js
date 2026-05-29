import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Report from '../models/Report.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

const router = express.Router();

// --- Auth / User Routes ---

// Login Route
router.post('/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let user = await User.findOne({ email: email, role: role });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials. User not found.' });
        }

        // Basic password check (assuming plain text for now based on current schema)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
        }

        // Output basic payload
        let payload = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            age: user.age || 0,
            gender: user.gender || '',
            medicalHistory: user.medicalHistory || '',
            allergies: user.allergies || [],
            emergencyContact: user.emergencyContact || { name: "", phone: "", relation: "" }
        };

        // If doctor, fetch doctor profile to get doctor-specific fields
        if (role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ userId: user._id });
            if (doctorProfile) {
                payload = {
                    ...payload,
                    id: doctorProfile._id, // Frontend uses doctor._id for distinct appointment booking often
                    userId: user._id, // But keep reference to user._id
                    specialty: doctorProfile.specialty,
                    price: doctorProfile.price,
                    rating: doctorProfile.rating || 4.5,
                    experience: doctorProfile.experience || 5,
                    nextAvailable: doctorProfile.nextAvailable || 'Tomorrow',
                    isVideoEnabled: doctorProfile.isVideoEnabled !== false,
                    about: doctorProfile.about || '',
                    qualifications: doctorProfile.qualifications || [],
                    verified: doctorProfile.verified !== false,
                    image: doctorProfile.image || `https://picsum.photos/100/100?random=${Date.now()}`
                };
            }
        }

        res.json({
            user: payload,
            role: user.role,
            token: 'dummy-jwt-token-123',
            isNewUser: false
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Signup Route
router.post('/auth/signup', async (req, res) => {
    const { email, password, role, name } = req.body;
    try {
        let user = await User.findOne({ email: email, role: role });
        if (user) {
            return res.status(400).json({ message: 'User already exists. Please login.' });
        }

        user = new User({
            name: name || (role === 'doctor' ? 'New Doctor' : 'New Patient'),
            email: email,
            password: password,
            role: role
        });
        await user.save();

        let payload = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            age: 0,
            gender: '',
            medicalHistory: '',
            allergies: [],
            emergencyContact: { name: "", phone: "", relation: "" }
        };

        if (role === 'doctor') {
            const doctor = new Doctor({
                userId: user._id,
                name: `Dr. ${user.name}`,
                specialty: 'General',
                price: '₹500'
            });
            await doctor.save();

            payload = {
                ...payload,
                id: doctor._id,
                userId: user._id,
                specialty: doctor.specialty,
                price: doctor.price,
                rating: 4.5,
                experience: 0,
                nextAvailable: 'To be updated',
                isVideoEnabled: true,
                about: '',
                qualifications: [],
                verified: false,
                image: `https://picsum.photos/100/100?random=${Date.now()}`
            };
        }

        res.status(201).json({
            user: payload,
            role: user.role,
            token: 'dummy-jwt-token-123',
            isNewUser: true
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// --- Doctor Routes ---
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Seed Initial Doctors Route (Helper to populate DB)
router.post('/seed-doctors', async (req, res) => {
    try {
        // Delete existing
        await Doctor.deleteMany();
        // Dummy Data
        const mockDoctors = [
            { name: 'Dr. Sharma', specialty: 'Cardiologist', rating: 4.8, nextAvailable: 'Today, 2:00 PM', price: '₹1000', isVideoEnabled: true, userId: new mongoose.Types.ObjectId() },
            { name: 'Dr. Verma', specialty: 'Dermatologist', rating: 4.5, nextAvailable: 'Tomorrow, 10:00 AM', price: '₹800', isVideoEnabled: true, userId: new mongoose.Types.ObjectId() },
            { name: 'Dr. Gupta', specialty: 'Pediatrician', rating: 4.9, nextAvailable: 'Today, 4:30 PM', price: '₹900', isVideoEnabled: false, userId: new mongoose.Types.ObjectId() }
        ];

        const inserted = await Doctor.insertMany(mockDoctors);
        res.json({ message: 'Seeded successfully', count: inserted.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Appointment Routes ---
router.get('/appointments/user/:userId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.params.userId });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/appointments', async (req, res) => {
    try {
        const newAppointment = new Appointment(req.body);
        const saved = await newAppointment.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Report Routes ---
router.get('/reports/user/:userId', async (req, res) => {
    try {
        const reports = await Report.find({ patientId: req.params.userId }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/reports', async (req, res) => {
    try {
        const newReport = new Report(req.body);
        const saved = await newReport.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- Chat Routes ---

// Get or Create Conversation
router.post('/conversations', async (req, res) => {
    const { participants } = req.body; // Array of IDs
    try {
        let conversation = await Conversation.findOne({
            participants: { $all: participants }
        });

        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Messages for a Conversation
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Save a new message (usually handled by socket, but good for fallback/API)
router.post('/messages', async (req, res) => {
    try {
        const newMessage = new Message(req.body);
        const saved = await newMessage.save();

        // Update conversation last message
        await Conversation.findByIdAndUpdate(req.body.conversationId, {
            lastMessage: req.body.text,
            updatedAt: Date.now()
        });

        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
