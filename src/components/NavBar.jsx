import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService.";

export default function NavBar() {
    const navigate = useNavigate();
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate("/login");
        }
        catch (error) {
            console.error("Logout failed", error);
            localStorage.clear();
            navigate('/login')
        }
    }

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand" >
                Home
            </Link>
            <div className="navbar-menu">
                {isAuthenticated ? (
                    <>
                        <Link to="/chatroom" className="navbar-link">
                            Chatroom
                        </Link>
                        <div className="navbar-user">
                            <span className="user-info">
                                Welcome, {currentUser.username}
                            </span>
                            <button className="logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-link">
                            Login
                        </Link>
                        <Link to="/signup" className="navbar-link">
                            Sign up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}