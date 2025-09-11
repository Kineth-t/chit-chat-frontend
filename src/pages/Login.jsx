import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from '../services/authService.js'


export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        try {
            const result = await authService.login(username, password);
            if (result.success) {
                setMessage("Log in succesful!");
                setTimeout(() => {
                    navigate('/chatroom')
                }, 2000);
            }
        }
        catch(error) {
            setMessage(error.message || "Login failed. Please try again.");
            console.error("Sign up failed", error)
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>Log in</h1>
                    <p>Log in to get started!</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} 
                    className="username-input" maxLength={20} required disabled={isLoading}/>
                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} 
                    className="password-input" required disabled={isLoading}/>
                    
                    <button type="submit" disabled={!username.trim() || !password.trim() || isLoading} 
                    className="login-btn">
                        {isLoading ? 'Logging in...' : "Log in"}
                    </button>

                    {message && (
                        <p className="auth-message" style={{color: message.includes('successful') ? '#4caf50' : '#ff6b6b'}}>
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
 }