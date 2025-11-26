  import express from 'express';
  import cors from 'cors';
  import { config } from 'dotenv';
  import connectToDatabase from './library/db.js';
  import router from './routes/userRoutes.js';
  import MessageRouter from './routes/messageRoutes.js';
  import { Server } from 'socket.io';
  import http from "http";
  import { Socket } from 'dgram';
  import { log } from 'console';



  // create express app
  const app = express();
  const server= http.createServer(app);

  // configure middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" })); // you can adjust 10mb or more
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // connect to ms sql server
  await connectToDatabase();

  // Initialize socket.io server
  export const io=new Server(server,{
      cors:{origin : "*"}
  });
    
  // store online user

  export  const userSocketMap ={};  //{UserId: socketId}

  // socket.io handler function 

  io.on("connection" , (socket)=>{
    const userId =socket.handshake.query.userId;
    // console.log("User connected userId", userId);

    if(userId){
      userSocketMap[userId]= socket.id;
    }

    // emit online users to all connected client
    io.emit("getOnlineUsers", Object.keys(userSocketMap ));

    socket.on("disconnect",()=>{
      // console.log("User disconnected ", userId);
      delete userSocketMap[userId];

      io.emit("getOnlineUsers", Object.keys(userSocketMap ))
      
    });
  });



  //  routes setup    
  app.get("/api/status",(req, res) => {
      res.send("Server is running end to end correctly !");
  });
  app.use('/api/auth', router);
  app.use("/api/messages",MessageRouter);

  // start the server

  server.listen(3001, () => {
      console.log(`Server is running on port 3001 `);
  });




