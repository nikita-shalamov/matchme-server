import mongoose from "mongoose";

const roomsSchema = mongoose.Schema({
    firstUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    secondUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
})

const Rooms = mongoose.model('Rooms', roomsSchema)

export default Rooms
