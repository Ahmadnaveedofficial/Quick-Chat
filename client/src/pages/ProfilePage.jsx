import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/Context.jsx';

const ProfilePage = () => {
  const { authUser, updateProfile, setAuthUser } = useContext(AuthContext);
  
const navigate=useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [FullName, setName] = useState(authUser?.FullName || '');
  const [Bio, setBio] = useState(authUser?.Bio || '');
  const [ProfileImage, setProfileImage] = useState(authUser?.ProfilePic || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If no new image selected
    if (!avatar) {
      await updateProfile({ FullName, Bio });
       setAuthUser((prev) => ({ ...prev, FullName, Bio }));
       navigate('/');
      return;
      
    }

    // Convert image to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      // Update on backend
      await updateProfile({
        ProfilePic: base64Image,
        FullName,
        Bio,
      });

      // Update locally (instant preview)
      setProfileImage(base64Image);
       setAuthUser((prev) => ({
        ...prev,
        ProfilePic: base64Image,
        FullName,
        Bio,
      }));  

       navigate("/")
    };

    reader.readAsDataURL(avatar);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      // Show immediate preview
      setProfileImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
          <h3 className="text-lg">Profile Information</h3>

          {/* Upload Input */}
          <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">
            <input
              type="file"
              id="avatar"
              name="ProfilePic"
              accept=".png, .jpeg, .jpg"
              hidden
              onChange={handleFileChange}
            />
            <img
              src={ProfileImage || assets.avatar_icon}
              alt="profile"
              className="w-12 h-12 rounded-full object-cover"
            />
            Upload Profile Picture
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            name="FullName"
            value={FullName}
            type="text"
            required
            placeholder="Your Name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            name="Bio"
            value={Bio}
            required
            placeholder="Your Bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}
          ></textarea>

          <button
            type="submit"
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer"
          >
            Save Changes
          </button>
        </form>

        {/* Updated Profile Preview */}
        <img
          src={ProfileImage || assets.logo_icon}
          alt="profile-preview"
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 object-cover"
        />
      </div>
    </div>
  );
};

export default ProfilePage;
