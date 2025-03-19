import { useState } from "react"; // Import useState
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Header from "../shared/header";
import Introduction from "../shared/Introduction"; // Import the Introduction component

const HomePage = () => {
  const navigate = useNavigate(); // Initialize the navigate function
  const [isLoading, setIsLoading] = useState(false); // State to manage loading
  const [introComplete, setIntroComplete] = useState(false); // State to track if introduction is complete

  // Sample project data with schema
  const projects = [
    {
      id: 1,
      title: "Database Schema for User Roles",
    },
    {
      id: 2,
      title: "Employee Management Database",
    },
    {
      id: 3,
      title: "Permissions & Access Control Schema",
    },
    {
      id: 4,
      title: "Customer Orders & Payments Schema",
    },
    {
      id: 5,
      title: "Product & Cart Schema",
    },
  ];

  // Function to handle image click
  const handleImageClick = () => {
    setIsLoading(true); // Set loading state to true

    // Simulate a 2-second delay before navigating
    setTimeout(() => {
      navigate("/new-project"); // Navigate to /new-project
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {!introComplete ? (
        // Show the Introduction component if intro is not complete
        <Introduction
          onComplete={() => {
            setIntroComplete(true); // Mark introduction as complete
          }}
        />
      ) : (
        // Show the HomePage content if intro is complete
        <>
          <Header showProjectTitle={false} />
          <main className="flex-grow p-10">
            <h1 className="text-2xl font-bold mb-6">Recent Projects</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow hover:cursor-pointer hover:text-blue-500 hover:scale-105 transition-all"
                >
                  <h2 className="text-xl font-semibold mb-2">
                    {project.title}
                  </h2>
                </div>
              ))}
            </div>
          </main>
          <footer className="bg-white shadow mt-auto py-4 text-center flex justify-center p-20">
            {isLoading ? ( // Show loading spinner if isLoading is true
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              // Show the button image if not loading
              <img
                src="/assets/button.png"
                alt="User"
                className="rounded-full mb-10 shadow-black shadow-2xl hover:scale-105 hover:cursor-pointer transition-all"
                onClick={handleImageClick} // Add onClick handler
              />
            )}
          </footer>
        </>
      )}
    </div>
  );
};

export default HomePage;
