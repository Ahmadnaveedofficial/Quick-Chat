
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./Context.jsx";
import { ChatContext } from "./Context.jsx";
import toast from "react-hot-toast";



export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios ,token,authUser  } = useContext(AuthContext);

    //  Get all users for sidebar
    const getUsers = async () => {
        if (!token){
             return;
        }
        try {
            const { data } = await axios.get("/api/messages/users");
              if (data) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages || {});
            } else {
                toast.error(data.message || "Failed to load users");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Get all messages for selected user
    const getMessages = async (UserId) => {
        try {
          //  const { data } = await axios.get(`/api/messages/${UserId}`);  change to below
         
          const { data } = await axios.get(`/api/messages/${UserId}`);
            if (data.success) {
                setMessages(data.messages);
            } else {
                toast.error(data.message || "Failed to load messages");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    //  Send message to selected user
    const sendMessage = async (messageData) => {
        if (!selectedUser) {
              toast.error("No user selected");
            return;

        }
       
        try {
            const { data } = await axios.post(
                `/api/messages/send/${selectedUser.UserID}`,
                messageData 
            );
            if (data.success) {
                setMessages((prev) => [...prev, data.data]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    //  Subscribe to real-time messages
    const subscribeToMessages = () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            if (selectedUser?.UserID && newMessage.SenderId === selectedUser.UserID) {
                newMessage.Seen = true;
                setMessages((prev) => [...prev, newMessage]);
             
                axios.put(`/api/messages/mark/${newMessage.MessageID}`).catch(() => { });
            } else {
                setUnseenMessages((prev) => ({
                    ...prev,
                    [newMessage.SenderId]:
                        prev[newMessage.SenderId] ? prev[newMessage.SenderId] + 1 : 1,
                }));
            }
        });
    };

    //  Unsubscribe to avoid duplicate listeners
    const unsubscribeFromMessages = () => {
        if (socket) socket.off("newMessage");
    };

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
    };

    return (
        <ChatContext.Provider value={value} >
            {children}
        </ChatContext.Provider>
    );

};
