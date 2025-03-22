import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../shared/header";
import {
  GENERATE_SCHEMA_URL, ProjectSchema
} from "../shared/constants/constants";


const Project = () => {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [schema, setSchema] = useState<ProjectSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);

  const handleImageClick = () => {
    navigate("/new-project");
    window.location.reload();
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) {
      alert("Please enter a question before submitting.");
      return;
    }

    setShowWelcome(false);
    setUserPrompt(userInput);
    setIsLoading(true);
    setShowSchema(false);

    try {
      const token = localStorage.getItem("access_token");
      console.log("Token:", token);
      const API_KEY =  import.meta.env.VITE_API_KEY;
      console.log(API_KEY)
      const apiResponse = await fetch(GENERATE_SCHEMA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_description: userInput,
          api_key: API_KEY,
          conversation_id: conversationId,
          user_feedback: schema ? userInput : null,
        }),
      });

      console.log("Response status:", apiResponse.status);

      if (!apiResponse.ok) {
        const errorResponse = await apiResponse.json();
        console.error("Error response from server:", errorResponse);
        throw new Error("Failed to generate schema");
      }

      const data: ProjectSchema = await apiResponse.json();
      console.log("Response data:", data);

      setSchema(data);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      setIsLoading(true);

      setTimeout(() => {
        setIsLoading(false);
        setShowSchema(true);
      }, 1000);
    } catch (error) {
      console.error("Error generating schema:", error);
      setSchema(null);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        showProjectTitle={userPrompt ? true : false}
        userImageSrc="/assets/user1.png"
        projectTitle={schema?.project_title.replace(/['"]+/g, "") || "New Project"}
      />
      <main
        className={`flex-grow p-10 h-full flex flex-col ${
          schema ? "" : "items-center"
        } ${
          showWelcome
            ? "justify-center"
            : userPrompt || !showSchema
            ? "justify-end"
            : ""
        }`}
      >
        {showWelcome && (
          <div className="flex flex-col items-center p-8 text-2xl">
            <h1 className="text-2xl font-semibold mb-2">
              Welcome, <i>User.</i>
            </h1>
            <div className="text-gray-600">What are we building today?</div>
          </div>
        )}
        {!showWelcome && (
          <div className="w-full">
            {showSchema && schema?.tables && schema.tables.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  Generated Schema
                </h2>
                <div className="gap-6 flex justify-center">
                  {schema.tables.map((table, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border-2 border-gray-200"
                    >
                      <h3 className="text-xl font-semibold mb-4 table-header p-2 pl-4">
                        {table.name}
                      </h3>
                      <p className="text-gray-600 mb-4 px-4">{table.description}</p>
                      <div className="space-y-4">
                        {table.fields.map((field, fieldIndex) => (
                          <div
                            key={fieldIndex}
                            className="px-4 pb-4 rounded-lg"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{field.name}</span>
                              <span className="text-sm">
                                {field.type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {field.required ? "Required" : "Optional"}:{" "}
                              {field.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="user-response p-3 pl-4 rounded-2xl mb-4 w-[40em]">
                <p className="text-gray-800 text-lg">{userPrompt}</p>
              </div>
              <div className="bg-white w-[40em] p-2 pl-4">
                <p className="text-gray-800 text-lg">
                  {isLoading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <>
                      {schema?.follow_up_question ||
                        "No follow-up question available."}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="bg-white shadow mt-auto py-4 text-center">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-full flex justify-between items-center max-w-2xl p-4 border shadow shadow-gray-100 border-gray-300 rounded-2xl mb-4 resize-none">
            <div className="w-[90%]">
              <input
                type="text"
                placeholder={
                  schema
                    ? "Provide feedback or type 'yes' to finalize..."
                    : "Ask anything"
                }
                className="placeholder:text-lg text-lg w-full focus:outline-none"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="focus:outline-none disabled:opacity-50"
              disabled={!userInput.trim() || isLoading}
            >
              <img
                src="/assets/ask.png"
                alt="Submit"
                className="hover:opacity-100 transition-opacity hover:cursor-pointer"
              />
            </button>
          </div>
        </form>
        <div className="flex justify-center">
          {
            showSchema && (
              <img
              src="/assets/button.png"
              alt="User"
              className="rounded-full w-55 mb-10 hover:scale-105 hover:cursor-pointer transition-all"
              onClick={handleImageClick}
            />
            )
          }
        </div>
      </footer>
    </div>
  );
};

export default Project;
