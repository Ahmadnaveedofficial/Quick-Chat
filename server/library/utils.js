import JWT from "jsonwebtoken";

// Utility function to generate a JWT token

export const generateToken = (id) => {
   const token = JWT.sign({id},process.env.JWT_SECRET, { expiresIn: '7d' });
    return token;
}


  