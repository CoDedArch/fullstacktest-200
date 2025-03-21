import React from "react";
import { useNavigate } from "react-router-dom";
import { HeaderProps } from "./constants/constants";

const Header: React.FC<HeaderProps> = ({
  showProjectTitle = true,
  userImageSrc = "/assets/user.png",
  projectTitle = "New Project",
}) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="bg-white shadow">
      <ul className="flex justify-between items-center px-10 py-4">
        <li>
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="h-10 hover:cursor-pointer"
            onClick={handleLogoClick}
          />
        </li>
        {showProjectTitle && (
          <li className="text-lg font-semibold">{projectTitle}</li>
        )}
        <li>
          <img src={userImageSrc} alt="User" className="h-10 rounded-full" />
        </li>
      </ul>
    </header>
  );
};

export default Header;