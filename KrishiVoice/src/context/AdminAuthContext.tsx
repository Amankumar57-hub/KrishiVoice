import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Check if there's an active Supabase session and if it's an admin
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('admin_users')
          .select('id, email')
          .eq('email', session.user.email)
          .maybeSingle();
        if (data) setAdminUser({ ...session.user, ...data });
        else setAdminUser(null);
      } else {
        setAdminUser(null);
      }
      setAdminLoading(false);
    }).catch(() => setAdminLoading(false));
  }, []);

  const adminSignIn = async (email, password) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;

    // Verify this user is in admin_users table
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (adminError || !adminData) {
      await supabase.auth.signOut();
      throw new Error('Access denied. This account is not an admin.');
    }

    setAdminUser({ ...authData.user, ...adminData });
    return adminData;
  };

  const adminSignOut = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminLoading, adminSignIn, adminSignOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
