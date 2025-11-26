
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { AuthContext } from "./Context.jsx";
import { Navigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

//  set global axios base URL
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  

  //  Check if user is authenticated
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      toast.error("Session expired, please login again");
      logout();
    }
  };

  // Login function
  const login = async (state, credentials) => {
    try {
      const res = await axios.post(`/api/auth/${state}`, credentials);
      const data = res.data;

      if (res.status === 200 || res.status === 201) {
        const userToken = data.token;
        setAuthUser(data.user);
        connectSocket(data.user);

        //  Set Authorization header globally
        axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
        setToken(userToken);
        localStorage.setItem("token", userToken);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  //  Logout function
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully!");
    if (socket) socket.disconnect();
  };

  //  Update Profile function
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data) {
        setAuthUser(data.updatedUser);
        toast.success("Profile updated successfully!");
        
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  // Connect socket for online user tracking
  const connectSocket = (userdata) => {
    if (!userdata || socket?.connected) {
      return;
    }
    const newSocket = io(backendUrl, {
    
      query: { userId: userdata.id },
     
    });

    newSocket.on("connect", () => {
      // console.log("Socket connected");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
     setOnlineUsers(userIds.map(id => Number(id)));
      // setOnlineUsers(userIds);
      
        
    });
 
    setSocket(newSocket);
  };

  //  On mount, load token and verify authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    }
  });

  const value = {
    axios,
    authUser,
    onlineUsers,
    setAuthUser,
    socket,
    login,
    logout,
    updateProfile,
  };

  return (
 <AuthContext.Provider value={value}>
    {children}
    </AuthContext.Provider>
  );
 
};
