import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { auth as firebaseAuth } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  // Fetch profile from profiles table
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
      else setProfile(null);
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // ── Supabase Auth Listener ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        const u = s?.user ?? null;
        if (u) {
          setUser(u);
          userIdRef.current = u.id;
          // Defer fetchProfile to the next tick to completely avoid Supabase auth deadlocks
          setTimeout(() => {
            fetchProfile(u.id).finally(() => setLoading(false));
          }, 0);
        } else {
          setUser(null);
          userIdRef.current = null;
          setLoading(false);
        }
      }
    );

    // ── Firebase Auth Listener ──
    const unsubscribeFirebase = onAuthStateChanged(firebaseAuth, async (fUser) => {
      // Check if we already have a Supabase user (prioritize Supabase for Email/Google)
      const { data: { user: currentSupabaseUser } } = await supabase.auth.getUser();
      
      if (fUser && !currentSupabaseUser) {
        // Firebase Phone User
        const shimUser = {
          id: fUser.uid,
          email: fUser.email || '',
          phone: fUser.phoneNumber || '',
          app_metadata: { provider: 'firebase' },
          user_metadata: { full_name: fUser.displayName }
        };
        setUser(shimUser);
        userIdRef.current = fUser.uid;
        await fetchProfile(fUser.uid);
      } else if (!fUser && !currentSupabaseUser) {
        // No user at all
        setUser(null);
        setSession(null);
        setProfile(null);
        userIdRef.current = null;
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, [fetchProfile]);

  const isSigningOut = useRef(false);

  const signOut = async () => {
    if (isSigningOut.current) return;
    isSigningOut.current = true;
    try {
      // Clear state immediately so UI updates
      setUser(null);
      setSession(null);
      setProfile(null);
      userIdRef.current = null;

      // Clear all auth-related localStorage
      localStorage.removeItem('krishi_ui_language');
      
      // Fire-and-forget sign out calls with a hard timeout
      await Promise.race([
        Promise.allSettled([
          supabase.auth.signOut().catch(() => {}),
          firebaseSignOut(firebaseAuth).catch(() => {}),
        ]),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]);
    } catch (err) {
      console.error('SignOut error:', err);
    } finally {
      isSigningOut.current = false;
      // Hard redirect as a safety net to ensure we leave the page
      window.location.href = '/login';
    }
  };

  // Always use the latest user ID via ref to prevent stale closure issues
  const refreshProfile = useCallback(() => {
    return fetchProfile(userIdRef.current);
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
