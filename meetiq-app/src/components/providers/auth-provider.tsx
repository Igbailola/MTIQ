'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * AuthProvider — wraps the app with authentication state.
 * Listens for Supabase auth changes and fetches user profile.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }, [supabase, setProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, s: Session | null) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.href = '/login';
  };

  const signInWithGoogle = async () => {
    // Check if next redirect or accept_invite parameters are present in current URL
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    
    // Construct the redirect URL with the next/invite parameters preserved
    let redirectUrl = `${window.location.origin}/auth/callback`;
    if (next) {
      redirectUrl += `?next=${encodeURIComponent(next)}`;
      
      // Also extract accept_invite if it's inside next, and forward it directly
      if (next.includes('accept_invite=')) {
        const inviteMatch = next.match(/[?&]accept_invite=([^&]+)/);
        if (inviteMatch) {
          redirectUrl += `&accept_invite=${inviteMatch[1]}`;
        }
      }
    } else {
      const acceptInvite = params.get('accept_invite');
      if (acceptInvite) {
        redirectUrl += `?accept_invite=${acceptInvite}`;
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, signInWithGoogle, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
