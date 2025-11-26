import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { AuthContext } from '../context/Context.jsx'
import { Toaster} from 'react-hot-toast'

const App = () => {
  const {authUser}= useContext(AuthContext);
  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain">
      
  <Routes>
        <Route path='/' element={authUser? <HomePage/> : <Navigate to="/login"/>}/>
        <Route path='/login' element={!authUser ? <LoginPage/> : <Navigate to="/"/> }/>
        <Route path='/profile' element={authUser? <ProfilePage/> :<Navigate to="/login"/>}/>
      </Routes>
      <Toaster/>
     
    
    </div>  
  )
}

export default App