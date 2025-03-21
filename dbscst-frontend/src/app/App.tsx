import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../ui/home";
import Project from "../ui/project";
import ProjectPage from "../ui/projectPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new-project" element={<Project />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Routes>
    </Router>
  );
}

export default App;