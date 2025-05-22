import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../utils/otp.utils.js'
import Otp from '../models/Otp.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
const resetTokens = new Map();

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const user = await User.create({ name, email, password });
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await Otp.create({ email, otp, expiresAt, user: user._id });

        await sendOtpEmail(email, otp, user.name);
        res.status(201).json({
            code: 201,
            message: 'User registered successfully. OTP sent to email.',
            data: {
                user,
                token,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Signup failed', error: err.message });
    }
});

router.get('/verify/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updatedUser = await User.findOneAndUpdate(
            { email: user.email },
            { $set: { isVerified: true } },
            { new: true }
        );
        if (!updatedUser) return res.status(404).json({ code: 404, message: 'User not found' });

        res.json({ code: 200, message: 'Email verified. You can now log in.' });
    } catch (err) {
        res.status(400).json({ code: 400, message: 'Invalid or expired token' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ code: 401, message: 'Invalid credentials' });
        }
        if (!user.isVerified) return res.status(403).json({ code: 403, message: 'Email not verified' });

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.cookie('token', token, { httpOnly: true }).json({ code: 200, message: `Welcome ${user.name}`, data: { user, token } });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

router.post('/verify-otp', requireAuth, async (req, res) => {
    try {
        const email = req.user.email;

        const { otp } = req.body;
        if (!otp) return res.status(400).json({ code: 400, message: 'OTP is required' });

        const storedOtp = await Otp.findOne({ email });
        if (!storedOtp) return res.status(400).json({ code: 400, message: 'OTP not found or expired' });

        if (Date.now() > storedOtp.expiresAt) {
            await Otp.deleteOne({ email });
            return res.status(410).json({ code: 410, message: 'OTP expired' });
        }

        console.log(storedOtp.otp !== otp, 'storedOtp.otp !== otp.......');

        if (storedOtp.otp !== otp) {
            return res.status(400).json({ code: 400, message: 'Invalid OTP' });
        }

        const user = await User.findOneAndUpdate(
            { email },
            { $set: { isVerified: true } },
            { new: true }
        );
        if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

        await Otp.deleteOne({ email });
        res.json({ code: 200, message: 'OTP verified successfully' });
    } catch (err) {
        res.status(500).json({ code: 500, message: 'Failed to verify OTP', error: err.message });
    }
});

router.get('/resend-otp', requireAuth, async (req, res) => {
    const email = req.user.email;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await Otp.create({ email, otp, expiresAt, user: user._id });

        await sendOtpEmail(email, otp)

        res.json({ code: 200, message: 'OTP resend to your email' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to resend OTP', error: err.message });
    }
});

export default router;




