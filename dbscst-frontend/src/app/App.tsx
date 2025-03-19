import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "../ui/home";
import Project from "../ui/project";

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new-project" element={<Project />} />
      </Routes>
    </Router>
   
  )
}

export default App
