import mongoose, { Schema } from "mongoose";


const sexSchema = new Schema({
    name: {
        type: String,
        unique: true
    }
})

const Sex = mongoose.model('Sex', sexSchema)

export default Sex