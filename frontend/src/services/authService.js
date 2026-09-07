import { supabase } from './supabaseClient';
import api from './api';

const TOKEN_KEY = 'vestige_auth_token';
const USER_KEY = 'vestige_user_profile';

// In-flight mutex locks to prevent duplicate submissions
let isSigningUpUser = false;
let isSigningUpVendor = false;
let isLoggingIn = false;

export const authService = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getCachedProfile: () => {
    try {
      const item = localStorage.getItem(USER_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  setCachedProfile: (profile) => {
    if (profile) {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Unified Authentication: Supabase Auth with Spring Boot Backend Verification and Credential Fallback
   */
  login: async (email, password, expectedRole = null) => {
    if (isLoggingIn) {
      throw new Error('Authentication is currently in progress. Please wait.');
    }

    isLoggingIn = true;
    const cleanEmail = email.trim();

    try {
      let sessionToken = null;
      let profile = null;
      let supabaseError = null;

      // 1. Primary: Attempt authentication via Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          supabaseError = error;
          console.info('Supabase Auth sign-in notification:', error.message);
        } else if (data?.session?.access_token) {
          sessionToken = data.session.access_token;
          authService.setToken(sessionToken);

          // Attempt to enrich identity & authoritative role against Spring Boot database
          try {
            const meResponse = await api.get('/auth/me');
            profile = meResponse.data;
          } catch (meErr) {
            console.warn('Backend profile verification unavailable, utilizing Supabase session profile:', meErr.message);
            const metadata = data.user?.user_metadata || {};
            profile = {
              id: data.user.id,
              email: data.user.email,
              fullName: metadata.full_name || data.user.email?.split('@')[0] || 'Patron',
              role: metadata.role || expectedRole || 'USER',
              preferredLanguage: metadata.preferred_language || 'en',
              active: true,
              rewardBalance: 0,
            };
          }
        }
      } catch (supabaseErr) {
        supabaseError = supabaseErr;
        console.warn('Supabase Auth sign-in exception:', supabaseErr.message);
      }

      // If Supabase specifically failed due to unconfirmed email, inform the user directly
      if (!profile && supabaseError?.message?.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please confirm your email address before signing in. Check your inbox for the verification link.');
      }

      // 2. Secondary: If Supabase Auth did not authenticate (e.g. seeded/development users), verify via backend credentials
      if (!profile) {
        try {
          const loginResponse = await api.post('/auth/login', {
            email: cleanEmail,
            password,
            expectedRole,
          });

          sessionToken = loginResponse.data?.token;
          profile = loginResponse.data?.profile;

          if (sessionToken) {
            authService.setToken(sessionToken);
          }
        } catch (backendErr) {
          console.warn('Backend credential login fallback notice:', backendErr.message);

          // If backend gave a specific authorization error, present its message
          if (backendErr.status === 401 || backendErr.status === 403) {
            throw new Error(backendErr.message || 'Invalid login credentials. Please check your email and password.');
          }

          // If Supabase returned invalid_credentials and backend is unreachable or returned 500
          if (
            supabaseError?.message?.toLowerCase().includes('invalid login credentials') ||
            supabaseError?.code === 'invalid_credentials'
          ) {
            throw new Error('Invalid login credentials. Please check your email and password.');
          }

          // If backend returned a specific non-500 validation message
          if (backendErr.message && !backendErr.message.includes('unexpected error') && !backendErr.message.includes('status: 500')) {
            throw backendErr;
          }

          throw new Error('Invalid login credentials. Please check your email and password.');
        }
      }

      if (!profile) {
        throw new Error('Invalid login credentials. Please check your email and password.');
      }

      // Role check validation against profile authority
      if (expectedRole && profile.role !== expectedRole && profile.role !== 'ADMIN') {
        authService.logout();
        throw new Error(
          `Access Denied: This portal is designated exclusively for ${expectedRole} accounts. Your profile holds the ${profile.role} role.`
        );
      }

      authService.setCachedProfile(profile);
      return { token: sessionToken, profile };
    } catch (err) {
      // Clear token on definitive authorization failures
      if (err.status === 401 || err.status === 403 || err.message?.includes('Access Denied')) {
        authService.logout();
      }
      throw err;
    } finally {
      isLoggingIn = false;
    }
  },

  /**
   * User Account Registration Flow (strictly creates Patron / USER accounts)
   * With deduplication, rate limit mitigation, and fallback for development testing
   */
  signUpUser: async (email, password, registrationData) => {
    if (isSigningUpUser) {
      throw new Error('Registration is currently in progress. Please wait.');
    }

    isSigningUpUser = true;
    const cleanEmail = email.trim();

    try {
      let sessionToken = null;
      let profile = null;
      let supabaseRateLimited = false;

      // 1. Attempt registration via Supabase Auth
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: registrationData.fullName,
              role: 'USER',
            },
          },
        });

        if (error) {
          if (
            error.status === 429 ||
            error.code === 'over_email_send_rate_limit' ||
            error.message?.toLowerCase().includes('rate limit')
          ) {
            supabaseRateLimited = true;
          } else {
            throw new Error(error.message || 'Unable to register user account.');
          }
        } else if (data?.session?.access_token) {
          sessionToken = data.session.access_token;
          authService.setToken(sessionToken);

          // Register application patron profile in Spring Boot database
          try {
            const response = await api.post('/auth/register/user', {
              fullName: registrationData.fullName,
              phone: registrationData.phone,
              preferredLanguage: registrationData.preferredLanguage || 'en',
            });
            profile = response.data;
          } catch (regErr) {
            console.warn('Backend patron registration notice:', regErr.message);
            profile = {
              id: data.user.id,
              email: data.user.email,
              fullName: registrationData.fullName,
              role: 'USER',
              preferredLanguage: registrationData.preferredLanguage || 'en',
              active: true,
              rewardBalance: 0,
            };
          }
        }
      } catch (supErr) {
        if (
          supErr.status === 429 ||
          supErr.message?.toLowerCase().includes('rate limit') ||
          supErr.message?.toLowerCase().includes('invalid')
        ) {
          supabaseRateLimited = true;
        } else {
          throw supErr;
        }
      }

      // 2. If Supabase email confirmation was rate limited or did not issue an immediate session,
      // register directly via backend API for development/testing reliability
      if (!profile) {
        try {
          const directResponse = await api.post('/auth/register/public/user', {
            fullName: registrationData.fullName,
            email: cleanEmail,
            password,
            phone: registrationData.phone,
            preferredLanguage: registrationData.preferredLanguage || 'en',
          });

          sessionToken = directResponse.data?.token;
          profile = directResponse.data?.profile;

          if (sessionToken) {
            authService.setToken(sessionToken);
          }
        } catch (backendErr) {
          if (supabaseRateLimited && backendErr.status !== 409) {
            throw new Error(
              'The authentication email service is temporarily rate-limited. Please wait a few minutes before requesting another verification email, or sign in if your account is already active.'
            );
          }
          throw backendErr;
        }
      }

      if (profile) {
        authService.setCachedProfile(profile);
      }

      return { token: sessionToken, profile };
    } finally {
      isSigningUpUser = false;
    }
  },

  /**
   * Vendor Partner Application / Registration Flow (strictly creates PENDING VENDOR accounts)
   * With deduplication, rate limit mitigation, and fallback for development testing
   */
  signUpVendor: async (email, password, vendorData) => {
    if (isSigningUpVendor) {
      throw new Error('Workshop registration is currently in progress. Please wait.');
    }

    isSigningUpVendor = true;
    const cleanEmail = email.trim();

    try {
      let sessionToken = null;
      let profile = null;
      let supabaseRateLimited = false;

      // 1. Attempt registration via Supabase Auth
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: vendorData.fullName,
              role: 'VENDOR',
            },
          },
        });

        if (error) {
          if (
            error.status === 429 ||
            error.code === 'over_email_send_rate_limit' ||
            error.message?.toLowerCase().includes('rate limit')
          ) {
            supabaseRateLimited = true;
          } else {
            throw new Error(error.message || 'Unable to register workshop account.');
          }
        } else if (data?.session?.access_token) {
          sessionToken = data.session.access_token;
          authService.setToken(sessionToken);

          try {
            const response = await api.post('/auth/register/vendor', {
              fullName: vendorData.fullName,
              phone: vendorData.phone,
              preferredLanguage: vendorData.preferredLanguage || 'en',
              businessName: vendorData.businessName,
              businessType: vendorData.businessType,
              address: vendorData.address,
              city: vendorData.city,
              state: vendorData.state,
              pincode: vendorData.pincode,
              whatsappNumber: vendorData.whatsappNumber,
              serviceTypes: vendorData.serviceTypes || [],
              deviceCategories: vendorData.deviceCategories || [],
              documentType: vendorData.documentType,
              documentUrl: vendorData.documentUrl,
            });

            profile = response.data;
          } catch (regErr) {
            console.warn('Backend workshop registration notice:', regErr.message);
            profile = {
              id: data.user.id,
              email: data.user.email,
              fullName: vendorData.fullName,
              role: 'VENDOR',
              preferredLanguage: vendorData.preferredLanguage || 'en',
              active: true,
              vendorProfile: {
                businessName: vendorData.businessName,
                verificationStatus: 'PENDING',
              },
            };
          }
        }
      } catch (supErr) {
        if (
          supErr.status === 429 ||
          supErr.message?.toLowerCase().includes('rate limit') ||
          supErr.message?.toLowerCase().includes('invalid')
        ) {
          supabaseRateLimited = true;
        } else {
          throw supErr;
        }
      }

      // 2. If Supabase email confirmation was rate limited or did not issue an immediate session,
      // register directly via backend API for development/testing reliability
      if (!profile) {
        try {
          const directResponse = await api.post('/auth/register/public/vendor', {
            fullName: vendorData.fullName,
            email: cleanEmail,
            password,
            phone: vendorData.phone,
            preferredLanguage: vendorData.preferredLanguage || 'en',
            businessName: vendorData.businessName,
            businessType: vendorData.businessType,
            address: vendorData.address,
            city: vendorData.city,
            state: vendorData.state,
            pincode: vendorData.pincode,
            whatsappNumber: vendorData.whatsappNumber,
            serviceTypes: vendorData.serviceTypes || [],
            deviceCategories: vendorData.deviceCategories || [],
            documentType: vendorData.documentType,
            documentUrl: vendorData.documentUrl,
          });

          sessionToken = directResponse.data?.token;
          profile = directResponse.data?.profile;

          if (sessionToken) {
            authService.setToken(sessionToken);
          }
        } catch (backendErr) {
          if (supabaseRateLimited && backendErr.status !== 409) {
            throw new Error(
              'The authentication email service is temporarily rate-limited. Please wait a few minutes before requesting another verification email, or sign in if your account is already active.'
            );
          }
          throw backendErr;
        }
      }

      if (profile) {
        authService.setCachedProfile(profile);
      }

      return { token: sessionToken, profile };
    } finally {
      isSigningUpVendor = false;
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      const profile = response.data;
      if (profile) {
        authService.setCachedProfile(profile);
        return profile;
      }
    } catch (err) {
      console.warn('Backend profile verification unavailable on boot, checking local state:', err.message);
    }

    // Fallback 1: Check Supabase session
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const user = data.session.user;
        const metadata = user.user_metadata || {};
        const cached = authService.getCachedProfile();
        const profile = {
          id: user.id,
          email: user.email,
          fullName: metadata.full_name || cached?.fullName || user.email?.split('@')[0] || 'Patron',
          role: metadata.role || cached?.role || 'USER',
          preferredLanguage: metadata.preferred_language || cached?.preferredLanguage || 'en',
          active: true,
          rewardBalance: cached?.rewardBalance || 0,
          vendorProfile: cached?.vendorProfile || null,
        };
        authService.setCachedProfile(profile);
        return profile;
      }
    } catch {
      // ignore
    }

    // Fallback 2: Cached profile in localStorage
    const cachedProfile = authService.getCachedProfile();
    if (cachedProfile && authService.getToken()) {
      return cachedProfile;
    }

    throw new Error('Session verification failed: No active profile or session found');
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  resetPassword: async (email) => {
    return supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  },
};

export default authService;
