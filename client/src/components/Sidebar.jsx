import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/Context.jsx'
import { ChatContext } from '../../context/Context.jsx'

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser,
    unseenMessages, setUnseenMessages } = useContext(ChatContext);

  const { logout, onlineUsers, authUser, token } = useContext(AuthContext);

  const navigate = useNavigate();

  const [input, setInput] = useState("");

  const filteredUsers = input ? users.filter((user) => user.FullName.toLowerCase().includes(input.toLowerCase())) : users;

  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     await getUsers();
  //   };
  //   fetchUsers();
  // });

  useEffect(() => {
  if (!authUser || !token) return;

  const fetchUsers = async () => {
    await getUsers();
  };
  fetchUsers();
}, [authUser, token]);


  return (
    <div className={`  bg-[#8185B2]/10 h-full p-5 relative rounded-r-xl overflow-y-scroll text-white ${selectedUser ? 'max-md:hidden' : ' '}`}>
      <div className='fixed ' >
        <div className='flex  justify-between items-center'> 
          <img src={assets.logo} alter="logo" className='max-w-40' />
          <div className="relative px-1 group">
            <img src={assets.menu_icon} alt="logo" className='max-h-5 cursor-pointer' />
            <div className='absolute top-full right-0 z-20 w-20 p-4 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
              <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
              <hr className='my-2 border-t border-grey-500' />
              <p onClick={() => logout()} className='cursor-pointer text-sm'>Logout</p>
            </div>
          </div>
        </div>
        <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5 w-[260px]'>
          <img src={assets.search_icon} alt='Search ' className='w-4' />
          <input onChange={(e) => setInput(e.target.value)} type='Text' className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
            placeholder='Search User...' />
        </div>
      </div>
      <div className='flex flex-col overflow-y-scroll absolute mt-20 mb-5 top-12 bottom-0 left-0 right-0 '>
        {filteredUsers.map((user, index) => (
          <div onClick={() => {
            setSelectedUser(user);
            setUnseenMessages(prev => (
              { ...prev, [user.UserID]: 0 }
            ))
          }}
            key={index} className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedUser?.UserID === user.UserID && 'bg-[#282142]/50'}`}>
            <img src={user?.ProfilePic || assets.avatar_icon} className='w-[35px] aspect-[1/1] rounded-full' />
            <div className='flex flex-col leading-5'>
              <p> {user.FullName}</p>
              {
                onlineUsers.includes(user.UserID) ? <span className='text-green-400 text-xs'>Online</span> : <span className='text-netural-400 text-xs'>Offline</span>
              }

            </div>
            {
              unseenMessages[user.UserID] > 0 && <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full 
                bg-violet-500/50'>{unseenMessages[user.UserID]}</p>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
export default Sidebar;


