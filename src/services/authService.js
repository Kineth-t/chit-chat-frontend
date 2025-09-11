import axios from "axios";

const API_URL = "http://localhost:8080";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type' : 'application/json'
    },
    withCredentials: true
});

// Response Interceptor for Global error handling
api.interceptors.use(
    (response) => response,
    (error) => {
        if (error.response) {
            switch (error.response.status) {
                case 401: // Unauthorised
                    authService.logout();
                    window.location.href='/lgoin';
                    break;
                case 403: // Forbidden acces
                    console.error("Access forbidden");
                    break;
                case 404: // Not found
                    console.error("Not found");
                    break;
                case 500: // Internal server error
                    console.error("Internal server error");
                    break;
            }
        }
        else if(error.request) {
            console.error("Request made, but didn't get the response " + error.request);
        }
        else {
            console.error("Something went wrong with the request " + error.message)
        }
    }
)

export const authService = {
    login: async (username, password) => {
        try {
            const response = await api.post('/auth/login', {
                username,
                password
            });

            const userData = {
                ...response.data,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(response.data));

            return {
                success: true,
                user: userData
            }
        }
        catch (error) {
            console.error("Login failed", error)
            const errorMessage = error.response?.message || 'Login failed, please check if you have entered the correct credentials';
            throw new errorMessage;
        }
    },
    signup: async (username, email, password) => {
        try {
            const response = await api.post('/auth/signup', {
                username,
                email,
                password
            });

            return {
                success: true,
                user: response.data
            };
        }
        catch(error) {
            console.error("Signup failed", error)
            const errorMessage = error.response?.message || 'Signed failed, please check if you have entered the correct credentials';
            throw new errorMessage;
        }
    },
    logout: async () => {
        try {
            await api.post('auth/logout');
        }
        catch (error) {
            console.error("Logout failed ", error);
        }
        finally {
            localStorage.remove('currentUser');
            localStorage.remove('user');
        }
    },
    fetchCurrentUser: async () => {
        try {
            const response = await api.get('/auth/getcurrentuser');

            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            console.error("Error occurred during fetching of user data", error);

            if(error.response && error.response.status === 401) {
                await authService.logout();
            }
        }
    },
    getCurrentUser: () => {
        const currentUserStr = localStorage.getItem("currentUser");
        const userStr = localStorage.getItem("user");

        try {
            if(currentUserStr) {
                return JSON.parse(currentUserStr)
            }
            else if(userStr) {
                const userData = JSON.parse(userStr)
                return {
                    ...userData
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error parsing user data', error);
            return null;
        }
    },
    isAuthenticated: () => {
        const user = localStorage.getItem("user") || localStorage.getItem("currentUSer");
        return !!user;
    },
    fetchPrivateMessages: async (user1, user2) => {
        try {
            const response = api.get(`api/messages/private?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`)
            return response.data;
        }
        catch (error) {
            console.error('Error occurred during fetching of private messages', error);
            throw error;
        }
    },
    getOnlineUsers: async () => {
        try {
            const response = await api.get("/auth/getonlineusers");
            return response.data;
        }
        catch (error) {
            console.error("Error in fetching all online users.", error);
        }
    }
}