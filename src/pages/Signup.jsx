import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from '../services/authService.js'


export default function Login() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        try {
            const result = await authService.signup(username, email, password);
            if (result.success) {
                setMessage("Signed up succesfully!");
                setTimeout(() => {
                    navigate('/login')
                }, 2000);
            }
        }
        catch(error) {
            setMessage(error.message || "Signup failed. Please try again.");
            console.error("Sign up failed", error)
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="signup-container">
            <div className="signup-box">
                <div className="signup-header">
                    <h1>Sign up</h1>
                    <p>Create an account to get started!</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} 
                    className="username-input" maxLength={20} required disabled={isLoading}/>
                    <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} 
                    className="username-input" maxLength={20} required disabled={isLoading}/>
                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} 
                    className="username-input" required disabled={isLoading}/>
                    <input type="password" placeholder="Password" onChange={(e) => setPassword2(e.target.value)} 
                    className="username-input" required disabled={isLoading}/>
                    
                    <button type="submit" disabled={!username.trim() || !email.trim() || !password.trim() || isLoading} 
                    className="signup-btn">
                        {isLoading ? 'Creating account...' : "Sign up"}
                    </button>

                    {message && (
                        <p className="auth-message" style={{color: message.includes('successfully') ? '#4caf50' : '#ff6b6b'}}>
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
 }