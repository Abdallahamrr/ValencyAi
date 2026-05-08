import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import SignIn from './pages/SignIn';
import AuthCallback from './pages/AuthCallback';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SelectRole from './pages/SelectRole';
import CompleteProfile from './pages/CompleteProfile';
import Landing from './pages/Landing';
import './styles/Global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                      element={<Landing />} />
        <Route path="/auth"                  element={<Auth />} />
        <Route path="/signin"                element={<SignIn />} />
        <Route path="/callback"              element={<AuthCallback />} />
        <Route path="/complete-profile"      element={<CompleteProfile />} />
        <Route path="/student-dashboard"     element={<StudentDashboard />} />
        <Route path="/teacher-dashboard"     element={<TeacherDashboard />} />
      </Routes> 
    </Router>
  );
}

export default App;