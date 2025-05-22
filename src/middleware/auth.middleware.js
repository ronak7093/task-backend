import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const cleanedToken = token.replace(/^"|"$/g, '');
        const decoded = jwt.decode(cleanedToken);

        // ✅ Fetch user from DB, exclude password
        req.user = await User.findById(decoded.id).select('-password');

        next(); // Proceed to the actual route
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};