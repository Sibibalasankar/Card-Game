import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kazhuthai_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        // Token might have expired
        logout();
      }
    } catch (err) {
      console.error('Error loading user:', err);
      // Keep offline/local user if DB failed but we already had registered
      const savedUser = localStorage.getItem('kazhuthai_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymous = async (username, avatar) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatar })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('kazhuthai_token', data.token);
        localStorage.setItem('kazhuthai_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Anonymous connection failed');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Anonymous connection error:', err);
      setError('Connection to server failed.');
      return { success: false, message: 'Server connection error.' };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('kazhuthai_token', data.token);
        localStorage.setItem('kazhuthai_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Login failed');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection to server failed.');
      return { success: false, message: 'Server connection error.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, avatar) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, avatar })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('kazhuthai_token', data.token);
        localStorage.setItem('kazhuthai_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Registration failed');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Connection to server failed.');
      return { success: false, message: 'Server connection error.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('kazhuthai_token');
    localStorage.removeItem('kazhuthai_user');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const updateProfileLocal = (updatedData) => {
    const newUserObj = { ...user, ...updatedData };
    setUser(newUserObj);
    localStorage.setItem('kazhuthai_user', JSON.stringify(newUserObj));
  };

  const updateProfile = async (username, avatar) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, avatar })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('kazhuthai_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        setError(data.message || 'Failed to update profile');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, loginAnonymous, updateProfile, logout, loadUser, updateProfileLocal, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};
