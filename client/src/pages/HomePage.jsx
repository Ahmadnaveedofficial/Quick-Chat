import React, { useContext} from 'react'
import Sidebar from '../components/Sidebar'
import ChatComponent from '../components/ChatComponent'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/Context.jsx'

const HomePage = () => {
  const {selectedUser} =useContext(ChatContext);
  return (  
    <div className=' flex items-center justify-center   h-screen w-full  '>     {/* sm:px-[15%] sm:py[5%] */}
     <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl
     overflow-hidden h-[90%] w-[90%] max-w-[1200px]  grid grid-cols-1 relative 
     ${selectedUser ?'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]':'md:grid-cols-2'} `} >
        <Sidebar />
        <ChatComponent />
        <RightSidebar/>
     </div>
    </div>
  )
}

export default HomePage