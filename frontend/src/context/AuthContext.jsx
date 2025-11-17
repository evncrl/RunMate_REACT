import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Set token in localStorage
  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Log for debugging
          console.log('fetchUser - Received user data:', data.user);
          console.log('fetchUser - isAdmin value:', data.user.isAdmin, 'Type:', typeof data.user.isAdmin);
          
          const userData = {
            ...data.user,
            isAdmin: data.user.isAdmin === true
          };
          
          console.log('fetchUser - Setting user with isAdmin:', userData.isAdmin);
          setCurrentUser(userData);
        } else {
          setToken(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const signup = async (email, password, name = '') => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create account');
    }

    setToken(data.token);
    // Ensure isAdmin is properly set (handle undefined/null)
    setCurrentUser({
      ...data.user,
      isAdmin: data.user.isAdmin === true
    });
    return data.user;
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to log in');
    }

    setToken(data.token);
    // Ensure isAdmin is properly set (handle undefined/null)
    const userData = {
      ...data.user,
      isAdmin: data.user.isAdmin === true
    };
    console.log('Login - Received user data:', data.user);
    console.log('Login - Setting user with isAdmin:', userData.isAdmin);
    setCurrentUser(userData);
    return userData;
  };

  const logout = async () => {
    setToken(null);
    setCurrentUser(null);
  };

  const updateUserProfile = async (profileData) => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    setCurrentUser(data.user);
    return data.user;
  };

  const uploadPhoto = async (file) => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch(`${API_URL}/upload-photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload photo');
    }

    setCurrentUser(data.user);
    return data.user;
  };

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateUserProfile,
    uploadPhoto,
    loading,
    setCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

