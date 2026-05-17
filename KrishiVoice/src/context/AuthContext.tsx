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
      async (_event, s) => {
        setSession(s);
        const u = s?.user ?? null;
        if (u) {
          setUser(u);
          userIdRef.current = u.id;
          await fetchProfile(u.id);
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

  const signOut = async () => {
    await Promise.all([
      supabase.auth.signOut(),
      firebaseSignOut(firebaseAuth)
    ]);
    setUser(null);
    setSession(null);
    setProfile(null);
    userIdRef.current = null;
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
