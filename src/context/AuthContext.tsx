import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

import { registerForPushNotificationsAsync } from '../utils/notifications';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // Committee member
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Don't attempt any auth calls; the app will show a config screen.
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
         checkUserRole(session.user.id);
         registerForPushNotificationsAsync(session.user.id);
      }
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        checkUserRole(session.user.id);
        registerForPushNotificationsAsync(session.user.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data && data.role === 'committee') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.error('Error checking role:', e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

