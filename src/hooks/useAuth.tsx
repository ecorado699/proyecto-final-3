import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Log session events
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            logSession(session.user.id, 'basic');
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logSession = async (userId: string, method: 'basic' | 'encrypted' | 'google') => {
    try {
      await supabase.from('session_logs').insert({
        user_id: userId,
        login_method: method,
        ip_address: null, // Could be enhanced with real IP detection
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging session:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Usar el edge function que captura la IP real del cliente
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { email, password }
      });

      if (error) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor de autenticación",
          variant: "destructive",
        });
        return { error };
      }

      // Manejar respuestas de error del edge function
      if (data.error) {
        if (data.error === 'blocked_by_security' || data.error === 'blocked_by_ml') {
          toast({
            title: "Acceso bloqueado por seguridad",
            description: data.message,
            variant: "destructive",
          });
          return { error: new Error(data.message) };
        }

        if (data.error === 'auth_failed') {
          toast({
            title: "Credenciales inválidas",
            description: "Email o contraseña incorrectos",
            variant: "destructive",
          });
          return { error: new Error(data.message) };
        }
      }

      // Login exitoso - establecer la sesión manualmente
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido al sistema",
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Error en signIn:', error);
      toast({
        title: "Error inesperado",
        description: "Por favor intenta nuevamente",
        variant: "destructive",
      });
      return { error: error as Error };
    }
  };


  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Error con Google",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        toast({
          title: "Error en registro",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Registro exitoso",
        description: "Revisa tu email para confirmar tu cuenta",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}