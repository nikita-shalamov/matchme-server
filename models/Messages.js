import mongoose from "mongoose";

const messagesSchema = mongoose.Schema({
    room: {type: mongoose.Schema.Types.ObjectId, ref: 'Rooms', required: true},
    user: {type: Number, required: true},
    content: {type: String, required: true},
    timestamp: {type: Date, default: Date.now()}
})

const Messages = mongoose.model('Messages', messagesSchema)

export default Messages