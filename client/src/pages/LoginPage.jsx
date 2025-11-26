import React, { useState } from 'react'
import assets from '../assets/assets'
import { useContext } from 'react';
import {AuthContext} from '../../context/Context.jsx'

const LoginPage = () => {
  const [currentState, setCurrentState]=useState("Login");
  const [fullName, setFullName]=useState("");
  const [email, setEmail]=useState("");
  const [password, setPassword]=useState("");
  const [bio, setBio]=useState("");
  const [isDataSubmitted, setIsDataSubmitted]=useState(false);

  const {login} =useContext(AuthContext);

  const onSubmitHandler=(e)=>{
    e.preventDefault();
    if( currentState==="Sign Up" && ! isDataSubmitted ){
           setIsDataSubmitted(true);
           return;
    }
    login(currentState==="Sign Up" ? 'signup' : "login", {
      FullName:fullName,Email:email,Password:password,Bio:bio
    })
  }
    return (
    <div className='min-h-screen bg-center flex items-center 
     justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
 {/* Left Section */}
   <img src={assets.logo_big} alt="App Logo" className='w-[min(30vw,250px)]'/>
    {/* Right Section */}

    <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
     <h2 className='font-medium text-2xl flex justify-between items-center'>
      {currentState}
       {isDataSubmitted &&  <img onClick={()=>setIsDataSubmitted(false)} src={assets.arrow_icon } alt="" className='w-5  cursor-pointer'/> }
     
      </h2>
           
        {currentState==="Sign Up" && ! isDataSubmitted &&  (
           <input  onChange={(e)=>setFullName(e.target.value )} value={fullName} name='FullName'
           type="text" placeholder='Full Name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'required/> 
        )}

        {!isDataSubmitted && (
          <>
          <input onChange={(e)=>setEmail(e.target.value )} value={email} name='Email'
          type="email" placeholder='Email' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' required/>
          <input onChange={(e)=>setPassword(e.target.value )} value={password} name='Password'
          type="password" placeholder='Password' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' required/>
          </>
        )}
      {
        currentState === "Sign Up" && isDataSubmitted && (
          <textarea onChange={(e)=>setBio(e.target.value )} value={bio} rows={4} name='Bio'
          placeholder='Provide a short bio ...' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'required/>
        )
  }
        <button type='submit' className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white  rounded-md cursor-pointer'>
          { currentState === "Sign Up" ? "Create Account" : "Login Now" }
        </button>
        <div className='flex items-center gap-2 text-center text-sm text-gray-500'>
          <input type="checkbox"  />
          <span>Agree to the terms of use & privacy policy.</span>
        </div>
        <div className='flex flex-col gap-2 text-center'>
          {currentState === "Sign Up" ? (
            <p className='text-sm text-gray-600'>Already have an account? <span className='font-medium text-violet-500 cursor-pointer ' onClick={()=>{setCurrentState("Login"); setIsDataSubmitted(false);}}>Login</span></p>
          ) : (
            <p className='text-sm text-gray-600'>Don't have an account? <span className='font-medium text-violet-500 cursor-pointer ' onClick={()=>setCurrentState("Sign Up")}>Sign Up</span></p>
          )}
        </div>
    </form>
    </div>
  )
}

export default LoginPage
