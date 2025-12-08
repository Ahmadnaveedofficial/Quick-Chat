import sql from 'mssql';
import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import cloudinary from '../library/cloudinary.js';
import { io, userSocketMap } from '../server.js';

const MessageRouter = express.Router();

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
const poolPromise = sql.connect(dbConfig);
// Route to fetch all users except the logged-in user

MessageRouter.get('/users', protectRoute, async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.user.id;
    //  Fetch all users except the logged in one
    const usersResult = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(`SELECT UserID, FullName, Email, ProfilePic, Bio, CreatedAt, UpdatedAt
        FROM Users WHERE UserID <> @UserId`);

    const filteredUsers = usersResult.recordset;

    // for each user count unseen messages
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await pool.request()
        .input('SenderId', sql.Int, user.UserID)
        .input('ReceiverId', sql.Int, userId)
        .query(`SELECT COUNT(*) AS count FROM Messages WHERE SenderId = @SenderId AND ReceiverId = @ReceiverId AND Seen = 0`);

      if (messages.recordset[0].count > 0) {
        unseenMessages[user.UserID] = messages.recordset[0].count;
      }
    });
    await Promise.all(promises);
    // final response
    res.status(200).json({ users: filteredUsers, unseenMessages });

  } catch (error) {
    console.error('Error fetching users:', error);
   res.status(500).json({ message: 'Server error fetching users.', error: error.message });

  }
})



// get all the messages for selected user
MessageRouter.get('/:id', protectRoute, async (req, res) => { 
  try {
    const pool = await poolPromise;
    const selectedUserId = parseInt(req.params.id);
    const myId = req.user.id;

    if (isNaN(selectedUserId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Check if the selected user exists
    const userCheck = await pool.request()
      .input('UserId', sql.Int, selectedUserId)
      .query('SELECT UserId FROM Users WHERE UserId = @UserId');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    //  Fetch all  messages between the two users
    const messagesResult = await pool.request()
      .input('MyId', sql.Int, myId)
      .input('SelectedUserId', sql.Int, selectedUserId)
      .query(`SELECT 
                MessageID,
          SenderId,
          ReceiverId,
          Text,
          Image,
          Seen,
          CreatedAt,
          UpdatedAt
        FROM Messages
        WHERE 
          (SenderId = @MyId AND ReceiverId = @SelectedUserId)
          OR
          (SenderId = @SelectedUserId AND ReceiverId = @MyId)
        ORDER BY CreatedAt ASC
            `);

    const messages = messagesResult.recordset;

    //  Mark unseen messages as seen
    await pool.request()
      .input('SenderId', sql.Int, selectedUserId)
      .input('ReceiverId', sql.Int, myId)
      .query(`
           UPDATE Messages SET Seen =1, UpdatedAt = SYSDATETIME()
        WHERE SenderId = @SenderId AND ReceiverId = @ReceiverId AND Seen = 0
        `);
    //  Send response
    res.status(200).json({
      success: true,
      totalMessages: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages.',
      error: error.message,
    });
  }
})


// API to mark a message as seen using Message ID
MessageRouter.put('/mark/:id', protectRoute, async (req, res) => {
  try {
    const pool = await poolPromise;
    const messageId = parseInt(req.params.id);
    const myId = req.user.id;

    if (isNaN(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format.' });
    }

    //  Verify message belongs to logged-in user
    const messageCheck = await pool.request()
      .input('MessageID', sql.Int, messageId)
      .input('ReceiverId', sql.Int, myId)
      .query(`
        SELECT * FROM Messages 
        WHERE MessageID = @MessageID AND ReceiverId = @ReceiverId
      `);

    if (messageCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Message not found or not authorized.' });
    }

    //  Update Seen status
    await pool.request()
      .input('MessageID', sql.Int, messageId)
      .query(`
        UPDATE Messages
        SET Seen = 1, UpdatedAt = SYSDATETIME()
        WHERE MessageID = @MessageID
      `);

    res.status(200).json({
      success: true,
      message: 'Message marked as seen successfully.'
    });

  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating message.',
      error: error.message,
    });
  }
});

// send message to selected User
MessageRouter.post('/send/:id', protectRoute, async (req, res) => {
  try {
    const pool = await poolPromise;
    const { Text, Image } = req.body;
    const ReceiverId = parseInt(req.params.id);
    const SenderId = req.user.id;

    if (isNaN(ReceiverId)) {
  return res.status(400).json({ message: 'Invalid receiver ID.' });
}
 
    if (!Text && !Image) {
      return res.status(400).json({ message: 'Message must contain text or an image.' });
    }

    //  upload image (if provided)
    let imageUrl = null;
    if (Image) {
      const uploadResponse = await cloudinary.uploader.upload(Image);
      imageUrl = uploadResponse.secure_url;
    }

    //  insert into database
    const result = await pool.request()
      .input('SenderId', sql.Int, SenderId)
      .input('ReceiverId', sql.Int, ReceiverId)
      .input('Text', sql.NVarChar(sql.MAX), Text || null)
      .input('Image', sql.NVarChar(sql.MAX), imageUrl || null)
      .query(`
        INSERT INTO Messages (SenderId, ReceiverId, Text, Image, Seen, CreatedAt, UpdatedAt)
        VALUES (@SenderId, @ReceiverId, @Text, @Image, 0, SYSDATETIME(), SYSDATETIME());
        SELECT SCOPE_IDENTITY() AS MessageID;
      `);

   // const newMessageId = result.recordset[0].MessageID;
const newMessageId = parseInt(result.recordset[0].MessageID);

    // emit the new message to the receiver socket 

    const receiverSocketId = userSocketMap[ReceiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        MessageID: newMessageId,
        SenderId,
        ReceiverId,
        Text,
        Image: imageUrl,
        Seen: 0,
        CreatedAt: new Date()
      });
    }

    //    return success
    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: {
        MessageID: newMessageId,
        SenderId,
        ReceiverId,
        Text,
        Image: imageUrl,
        Seen: 0
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending message.',
      error: error.message
    });
  }
});

export default MessageRouter;
