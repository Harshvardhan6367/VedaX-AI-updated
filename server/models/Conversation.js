import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: String, // User or Doctor IDs
        required: true
    }],
    lastMessage: {
        type: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
