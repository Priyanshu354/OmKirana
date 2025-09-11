const mongoose = require("mongoose");

const closeLendingSchema = new mongoose.model({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    closelendingorders: [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "LendedOrder",
            require : true,
        },
    ],
    paidAmount : {
        type : Number,
        require: true,
        min : 1,
    },
    paidAt : { type: Date, default: Date.now},
    closeAt: { type: Date, default: Date.now}
}, { timestamps: true });


module.exports = mongoose.model("ClosedLending", closeLendingSchema);