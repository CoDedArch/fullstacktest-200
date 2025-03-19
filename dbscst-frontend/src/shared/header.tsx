import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

// Define the props interface
interface HeaderProps {
  showProjectTitle?: boolean; // Optional prop to control visibility
  userImageSrc?: string; // Optional prop to specify the user image source
}

const Header: React.FC<HeaderProps> = ({ showProjectTitle = true, userImageSrc = "/assets/user.png" }) => {
  const navigate = useNavigate(); // Initialize the navigate function

  // Function to handle logo click
  const handleLogoClick = () => {
    navigate("/"); // Navigate to the home page
  };

  return (
    <header className="bg-white shadow">
      <ul className="flex justify-between items-center px-10 py-4">
        <li>
          {/* Make the logo clickable */}
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="h-10 hover:cursor-pointer"
            onClick={handleLogoClick} // Add onClick handler
          />
        </li>
        {showProjectTitle && ( // Conditionally render the "New Project" li
          <li className="text-lg font-semibold">New Project</li>
        )}
        <li>
          {/* Use the userImageSrc prop for the image source */}
          <img src={userImageSrc} alt="User" className="h-10 rounded-full" />
        </li>
      </ul>
    </header>
  );
};

export default Header;