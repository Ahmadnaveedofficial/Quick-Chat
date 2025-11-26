import React, { useContext, useEffect, useRef, useState } from 'react'
// import assets, { messagesDummyData } from '../assets/assets'
import assets from '../assets/assets'
import { formatMessageTime } from '../library/utils';
import { AuthContext } from '../../context/Context.jsx';
import { ChatContext } from '../../context/Context.jsx';
import { toast } from 'react-hot-toast';


const ChatComponent = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);
  const scrollEnd = useRef();

  const [input, setInput] = useState('');
  // handle send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === " ") {
      return null;
    }
    await sendMessage({ Text: input.trim() });
    setInput('');
  }

  // handle send a image

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ Image: reader.result });
      e.target.value = "";
    }
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser.UserID);

    }
  }, [selectedUser])

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])
  return selectedUser ? (
    <div className=' h-full overflow-scroll relative flex flex-col backdrop-blur-lg '>
      {/*header*/}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.ProfilePic || assets.avatar_icon} alter="" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.FullName}
          {onlineUsers.includes(selectedUser.UserID) ?
            <span className='w-2 h-2 rounded-full bg-green-500'></span> :
            <span className='w-2 h-2 rounded-full bg-gray-500'></span>}

        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className=' md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>
      {/*chat Area*/}
      <div className=' flex flex-col h-[calc(100% -100px)] overflow-y-scroll p-3 pb-6 mb-20'>
        {
          messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 justify-end ${msg.SenderId !== authUser.id && 'flex-row-reverse'} `} >
              {msg.Image ? (
                <img src={msg.Image} className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
              ) : (
                <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/50 text-white
                  ${msg.SenderId===authUser.id ? 'rounded-br-none': 'rounded-bl-none'}`}>{msg.Text}</p>
              )}  
              <div className=' text-center text-xs'>
                <img src={
                  msg.SenderId === authUser.id
                    ? authUser?.ProfilePic || assets.avatar_icon
                    : selectedUser?.ProfilePic || assets.avatar_icon
                }
                  className='
                     w-7 rounded-full' alt="" />
                <p className='text-gray-500'> {formatMessageTime(msg.CreatedAt)}</p>
              </div>
            </div>
          ))}
        <div ref={scrollEnd}></div>
      </div>
      {/*bottom Area*/}
      <div className='absolute bottom-0 z-50 left-0 right-0  p-3'>
        <div className='flex items-center gap-3'>

        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full '>
          <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type='text' placeholder='Send a message '
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
          <input onChange={handleSendImage} type='file' id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor='image'>
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} className='w-7 cursor-pointer' />
      </div>
            </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden '>
      <img src={assets.logo_icon} alt="" className='max-w-16' />
      <p className='text-lg font-medium text-white'> Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatComponent