import { Schema, model } from "mongoose";

const likeSchema = new Schema({
    fromUser: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    toUser: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    isMutual: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Likes = model('Likes', likeSchema);

export default Likes;
