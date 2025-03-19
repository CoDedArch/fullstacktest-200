import { useState } from "react"; // Import useState
import Header from "../shared/header";

const Project = () => {
  const [userInput, setUserInput] = useState(""); // State to store user input
  const [showWelcome, setShowWelcome] = useState(true); // State to control welcome message visibility
  const [response, setResponse] = useState(""); // State to store AI response

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Check if input is empty
    if (!userInput.trim()) {
      alert("Please enter a question before submitting."); // Show alert if input is empty
      return;
    }

    // Hide the welcome message
    setShowWelcome(false);

    // Simulate an AI response (replace this with actual API call)
    const aiResponse = `You asked: "${userInput}". Here's a response from the AI: This is a placeholder response.`;
    setResponse(aiResponse);

    // Clear the input field
    setUserInput(userInput);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header showProjectTitle={false} userImageSrc="/assets/user1.png" />
      <main className="flex-grow p-10 h-full flex justify-center items-center">
        {showWelcome && ( // Conditionally render the welcome message
          <div className="flex flex-col items-center p-8 text-2xl">
            <h1 className="text-2xl font-semibold mb-2">
              Welcome, <i>User!</i>
            </h1>
            <div className="text-gray-600">What are we building today?</div>
          </div>
        )}
        {!showWelcome && ( // Conditionally render the user input and AI response
          <div className="w-full max-w-2xl mt-auto">
            <div className="bg-white p-2 rounded-lg shadow-md mb-4">
              <p className="text-gray-800">{userInput}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg shadow-md">
              <p className="text-gray-800">{response}</p>
            </div>
          </div>
        )}
      </main>
      <footer className="bg-white shadow mt-auto py-4 text-center">
        <form onSubmit={handleSubmit} className="flex flex-col items-center mb-10">
          {/* Text Area */}
          <div className="w-full flex justify-between max-w-2xl p-4 border border-gray-300 rounded-2xl mb-4 resize-none">
            <div className="w-[90%]">
              <input
                type="text"
                placeholder="Ask anything..."
                className="placeholder:text-2xl text-lg w-full focus:outline-none"
                value={userInput} // Bind input value to state
                onChange={(e) => setUserInput(e.target.value)} // Update state on change
              />
            </div>
            <button
              type="submit"
              className="focus:outline-none disabled:opacity-50" // Disable button when input is empty
              disabled={!userInput.trim()} // Disable if input is empty
            >
              <img
                src="/assets/ask.png" // Replace with your image path
                alt="Submit"
                className="hover:opacity-100 transition-opacity hover:cursor-pointer"
              />
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default Project;