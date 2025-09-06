import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import NavBar from './components/NavBar';
import Main from './pages/Main.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Chat from './pages/Chat.jsx';


export default function App() {
  return (
    <Router>
      <div className="app">
        <NavBar/>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chatroom" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}