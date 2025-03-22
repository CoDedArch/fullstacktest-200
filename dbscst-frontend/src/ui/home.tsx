import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../shared/header";
import Introduction from "../shared/introduction";
import {
  ProjectInterface,
  USER_PROJECTS_URL,
} from "../shared/constants/constants";

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [projects, setProjects] = useState<ProjectInterface[]>([]);

  const handleImageClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/new-project");
    }, 2000);
  };

  const fetchUserProjects = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(USER_PROJECTS_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user projects");
      }

      const data = await response.json();
      if (data.message) {
        setProjects([]);
        setMessage(data.message);
      } else {
        setProjects(data);
        console.log(data);
      }
    } catch (error) {
      console.error("Error fetching user projects:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const username = localStorage.getItem("username");

    if (username === "anonymous") {
      setIntroComplete(true);
    } else if (
      token &&
      isLoggedIn &&
      localStorage.getItem("token_expiry") &&
      Date.now() < parseInt(localStorage.getItem("token_expiry")!)
    ) {
      setIntroComplete(true);
      fetchUserProjects();
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token_expiry");
      localStorage.removeItem("username");
    }
  }, []);

  useEffect(() => {
    const tokenExpiry = localStorage.getItem("token_expiry");

    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry) - Date.now();

      if (expiryTime > 0) {
        const timeout = setTimeout(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("token_expiry");
          setIntroComplete(false);
        }, expiryTime);

        return () => clearTimeout(timeout);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token_expiry");
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!introComplete ? (
        <Introduction
          onComplete={() => {
            setIntroComplete(true);
            fetchUserProjects();
          }}
        />
      ) : (
        <>
          <Header showProjectTitle={false} />
          <main
            className={`flex-grow p-10 ${
              projects.length > 0
                ? ""
                : "flex flex-col justify-center items-center"
            }`}
          >
            <h1 className="text-2xl font-bold mb-6 text-center">
              Recent Projects
            </h1>
            <div
              className={` ${projects.length > 0 ? "text-center gap-6" : ""}`}
            >
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-6 "
                    onClick={() => navigate(project.url)}
                  >
                    <h2 className="text-xl font-semibold mb-2">
                      <span className="hover:text-blue-500 transition-all  hover:cursor-pointer">
                        {project.name.replace(/['"]+/g, "")}
                      </span>
                    </h2>
                    {/* {project.description && (
                      <p className="text-gray-600 mb-4">
                        {project.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created at:{" "}
                      {new Date(project.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Schemas: {project.schemas.length}
                    </p> */}
                  </div>
                ))
              ) : (
                <h1
                  className={`text-gray-600 text-2xl ${
                    projects.length > 0 ? "hidden" : ""
                  }`}
                >
                  {message}
                </h1>
              )}
            </div>
          </main>
          <footer className="bg-white shadow mt-auto py-4 text-center flex justify-center p-20">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <img
                src="/assets/button.png"
                alt="User"
                className="rounded-full mb-10 hover:scale-105 hover:cursor-pointer transition-all"
                onClick={handleImageClick}
              />
            )}
          </footer>
        </>
      )}
    </div>
  );
};

export default HomePage;
