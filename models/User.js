import { Schema, model } from "mongoose";
import Sex from "./Sex.js";
import City from "./City.js";


const userSchema = new Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    birthDate: {
        type: Date,
        required: true
    },
    sex: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Sex'
    },
    city: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'City'
    },
    description: {
        type: String
    },
    photos: [{ type: String }],
    interests: [{type: String}]
}, {
    timestamps: true
})

const User = model('User', userSchema)

export default User

