import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCreatingBuildingRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }

  function generateBuildingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i += 1) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `VAAD-${suffix}`;
  }

  async function ensureAdminBuilding() {
    if (!user?.id || !profile?.admin || profile?.building_id || isCreatingBuildingRef.current) {
      return;
    }
    isCreatingBuildingRef.current = true;

    try {
      const code = generateBuildingCode();
      const { data: buildingId, error } = await supabase.rpc('create_admin_building', {
        p_name: `בניין של ${profile.full_name || 'ועד הבית'}`,
        p_code: code,
      });

      if (error) throw error;
      await fetchProfile(user.id);
    } finally {
      isCreatingBuildingRef.current = false;
    }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp({ email, password, full_name, floor, apartment, avatar_url }) {
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          floor: String(parseInt(floor, 10)),
          apartment: String(parseInt(apartment, 10)),
          avatar_url: avatar_url || '',
        },
      },
    });
    if (authError) throw authError;

    // If email confirmation is enabled in Supabase, signUp may not create a session.
    // Try to sign in directly so successful registrations move into the app immediately.
    if (!signUpData?.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const msg = signInError.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed')) {
          throw new Error('EMAIL_CONFIRMATION_REQUIRED');
        }
        throw signInError;
      }
    }
  }

  async function joinBuilding(code) {
    const normalizedCode = code.trim().toUpperCase();
    const { data: building } = await supabase
      .from('buildings')
      .select('id')
      .eq('code', normalizedCode)
      .single();

    if (!building) throw new Error('INVALID_BUILDING_CODE');

    const { data, error } = await supabase
      .from('users')
      .update({ building_id: building.id })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
  }

  async function getBuildingCode() {
    if (profile?.admin) {
      const { data } = await supabase
        .from('buildings')
        .select('code')
        .eq('admin_user_id', user.id)
        .single();
      return data?.code || null;
    }
    if (!profile?.building_id) return null;
    const { data } = await supabase
      .from('buildings')
      .select('code')
      .eq('id', profile.building_id)
      .single();
    return data?.code || null;
  }

  useEffect(() => {
    ensureAdminBuilding();
  }, [profile?.admin, profile?.building_id, user?.id]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function deleteAccount() {
    if (!user) return;
    await supabase.from('users').delete().eq('id', user.id);
    await signOut();
  }

  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.admin === true,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        updateProfile,
        joinBuilding,
        getBuildingCode,
        hasBuilding: !!profile?.building_id,
        refreshProfile: () => user && fetchProfile(user.id),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
