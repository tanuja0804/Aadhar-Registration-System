const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const aadhaarSchema = new mongoose.Schema({
    unique_id: {
        type: Number,
        required: true,
        unique: true,
        min: 100000000,
        max: 999999999,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other'], // Validate gender
    },
    dob: {
        type: Date,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, 'Please provide a valid email address'], // Validate email format
    },
    contactDetails: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isMobilePhone, 'Please provide a valid contact number'], // Validate phone number
    },
    fathersName: {
        type: String,
        required: true,
    },
    mothersName: {
        type: String,
        required: true,
    },
    photoURL: {
        type: String,
        required: true,
        //validate: [validator.isURL, 'Please provide a valid URL'], // Validate URL format (cannot use since we use multer to store images locally(disk storage) and not on cloud)-> we can use firebase for this instead.
    },
    signatureURL: {
        type: String,
        required: true,
        //validate: [validator.isURL, 'Please provide a valid URL'], // Validate URL format
    },
    password: {
        type: String,
        required: true,
    },
});

// Hashing password before saving
aadhaarSchema.pre('save', async function(next) {
    const aadhaar = this;
    if (!aadhaar.isModified('password')) return next();

    // Hash the password using bcrypt
    try {
        const salt = await bcrypt.genSalt(10);
        aadhaar.password = await bcrypt.hash(aadhaar.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const Aadhaar = mongoose.model('Aadhaar', aadhaarSchema);

module.exports = Aadhaar;
