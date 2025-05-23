import { useState, useEffect } from 'react';

const useAuth = (supabase, toast) => {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        toast({ title: 'Session Error', description: 'Could not retrieve session information.', variant: 'destructive' });
      }
      setSession(currentSession);
      setIsLoadingSession(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) {
          setIsLoadingSession(false);
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === 'function') {
        authListener.subscription.unsubscribe();
      }
    };
  }, [supabase, toast]);

  // SignUp functionality removed

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Sign In Error:", error);
      toast({ title: 'Login Error', description: error.message || 'Failed to sign in.', variant: 'destructive' });
      return null;
    }
    if (data.session) {
      setSession(data.session);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      return data.session;
    }
    toast({ title: 'Login Issue', description: 'Could not establish a session. Please try again.', variant: 'destructive' });
    return null;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign Out Error:", error);
      toast({ title: 'Logout Error', description: error.message || 'Failed to sign out.', variant: 'destructive' });
    } else {
      setSession(null);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    }
  };

  return { session, isLoadingSession, signIn, signOut };
};

export default useAuth;