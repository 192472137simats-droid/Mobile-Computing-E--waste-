import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { AuthContext } from './AuthContextState';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCachedProfile());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authService.getToken()));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initAuth() {
      const token = authService.getToken();
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (err) {
          console.warn('Session verification failed on boot:', err);
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password, expectedRole) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.login(email, password, expectedRole);
      setUser(result.profile);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpUser = async (email, password, regData) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.signUpUser(email, password, regData);
      setUser(result.profile);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpVendor = async (email, password, vendorData) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.signUpVendor(email, password, vendorData);
      setUser(result.profile);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      setError(err.message || 'Vendor registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isLoading,
        error,
        login,
        signUpUser,
        signUpVendor,
        logout,
        role: user?.role || null,
        vendorProfile: user?.vendorProfile || null,
        isVerifiedVendor: user?.role === 'VENDOR' && user?.vendorProfile?.verificationStatus === 'VERIFIED',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
