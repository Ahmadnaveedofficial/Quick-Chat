import express from 'express';
import sql from 'mssql';
import { generateToken } from '../library/utils.js';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';
import { protectRoute } from '../middleware/auth.js';
import cloudinary from '../library/cloudinary.js';
import 'dotenv/config'


const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
};

const router = express.Router();

const poolPromise = sql.connect(dbConfig);



// Controller for user registration
router.post('/signup', async (req, res) => {
    const {Email, FullName, Password, Bio, ProfilePic} = req.body;
    
    try {
        const pool = await poolPromise;
        if(!FullName || !Password || !Email){
           return res.status(400).json({message: "Please provide all required fields."});
        }
        if(Password.length < 6){
           return res.status(400).json({message: "Password must be at least 6 characters long."});
        }
        const checkEmail= await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT COUNT(*) AS count FROM Users WHERE Email = @Email');
        // Check if email already exists
        if (checkEmail.recordset[0].count > 0) {
            return res.status(400).json({ message: "Email already exists." });
        }

         // Hash password
        const hashedPassword = await bcrypt.hash(Password, 10);
        
        // Handle profile picture upload if provided
        let profilePicUrl = null;
        if (ProfilePic && ProfilePic.startsWith('data:image')) {
          try {
             const uploadResult = await cloudinary.uploader.upload(ProfilePic);
            profilePicUrl = uploadResult.secure_url;
          } catch (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Error uploading profile picture.' });
          }}

        // Insert new user into DB
        const result = await pool.request()
            .input('FullName', sql.NVarChar, FullName)
            .input('Email', sql.NVarChar, Email)
            .input('Password', sql.NVarChar, hashedPassword) 
            .input('Bio', sql.NVarChar, Bio || null)
            .input('ProfilePic', sql.NVarChar,profilePicUrl || null)
            .query(' INSERT INTO Users (FullName, Email, Password, Bio, ProfilePic)  OUTPUT INSERTED.UserID VALUES (@FullName, @Email, @Password, @Bio, @ProfilePic) ');

            const newUserId= result.recordset[0].UserID; 
            const token = generateToken(newUserId);

            res.status(201).json({message: "User registered successfully.", token,
                user: { id: newUserId, FullName, Email, Bio ,ProfilePic: profilePicUrl || null},
            });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});





// Controller for user login
router.post('/login', async (req, res) => {
    const { Email, Password } = req.body;
    
   try {
    // Check if token already exists in headers
     const authHeader = req.headers.authorization;
     if(authHeader && authHeader.startsWith('Bearer ')){
        const token = authHeader.split(' ')[1];
        try {
              const decoded = JWT.verify(token, process.env.JWT_SECRET);
                return res.status(200).json({
                    message: 'User already logged in',
                    id: decoded.id,
                });
        } catch (error) {
            // Token invalid or expired, proceed to login
            console.error('Token invalid or expired:', error);
        }
     }
     const pool = await poolPromise;
     
      if (!Email || !Password) {
      return res.status(400).json({ message: 'Please provide Email and Password.' });
    }
    // Fetch user from DB
    const result = await pool.request()
        .input('Email', sql.NVarChar, Email)
        .query('SELECT * FROM Users WHERE Email = @Email');

    
     // Check if user exists
        const user = result.recordset[0];
        if (!user) {
        return res.status(400).json({ message: 'User not found.' });
    }
    // Compare password
          const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password.' });
    // Generate JWT token
    const token = generateToken(user.UserID);
    res.status(200).json({ message: 'Login successful.', token ,
        user: {
        id: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Bio: user.Bio,
        ProfilePic: user.ProfilePic,
      },
    });
   } catch (error) {
       console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error.' });
   }
});






// Controller to check if user is authenticated
router.get('/check', protectRoute, async (req, res) => {
   try {
      const pool = await poolPromise;
     const result = await pool.request()
     .input('UserID', sql.Int, req.user.id)
        .query('SELECT UserID, FullName, Email, Bio, ProfilePic FROM Users WHERE UserID = @UserID');
        const user = result.recordset[0];
        if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
     res.json({ message: `Welcome, ${user.Email}!`, user : {
        id: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Bio: user.Bio,
        ProfilePic: user.ProfilePic,
      }});
   } catch (error) {
     console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error.' });
   }
});




// Controller to update user profile
router.put('/update-profile', protectRoute, async (req, res) => {
  const { FullName, Bio, ProfilePic } = req.body;
  console.log(req.body)
  try {
    const pool = await poolPromise;
    // First, get the current user record
    const result = await pool.request()
      .input('UserID', sql.Int, req.user.id)
      .query('SELECT * FROM Users WHERE UserID = @UserID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingUser = result.recordset[0];

    // Step 1 Check if new profile picture provided
   let updatedProfilePic = existingUser.ProfilePic; // default = old one

  if (ProfilePic && ProfilePic.startsWith('data:image')) {
      // Step 2 Upload new picture to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(ProfilePic)
      updatedProfilePic = uploadResult.secure_url;
    }
    // Step 3 Update user record in DB  use old values if new not provided
    const updatedFullName = FullName || existingUser.FullName;
    const updatedBio = Bio || existingUser.Bio;

    // Step 4 Update database
    await pool.request()
      .input('UserID', sql.Int, req.user.id)
      .input('FullName', sql.NVarChar, updatedFullName)
      .input('Bio', sql.NVarChar, updatedBio)
      .input('ProfilePic', sql.NVarChar, updatedProfilePic)
      .query(`
        UPDATE Users 
        SET FullName = @FullName, Bio = @Bio, ProfilePic = @ProfilePic 
        WHERE UserID = @UserID
      `);
    // Step 5 Response
      res.status(200).json({
      message: 'Profile updated successfully.',
      updatedUser: {
        id: req.user.id,  
        FullName: updatedFullName,
        Bio: updatedBio,
        ProfilePic: updatedProfilePic,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


export default router;

