
// Middleware to protect routes
import JWT from 'jsonwebtoken';    

export const protectRoute = (req, res, next) => {
    try {
        let token;
        // Check if token is in headers
        if (
            req.headers.authorization && req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized. No token provided. Access denied.' });
        }
      // Verify token
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        // attach user info to request  decoded contains id
        req.user=decoded;  
        // Continue to next middleware/route
        next();
    } catch (error) {
        console.error('Error in auth middleware:', error);
        res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
    }
}