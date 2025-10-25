import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, password } = await req.json();
    
    // Obtener la IP real del cliente (si no, usar una IP válida por defecto)
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || req.headers.get('cf-connecting-ip')
      || '';
    const clientIp = rawIp && rawIp !== '' ? rawIp : '0.0.0.0';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log(`Login attempt from IP: ${clientIp}, Email: ${email}`);

    // 1. Verificar si la IP está bloqueada antes de intentar login
    const { data: ipCheck } = await supabase.rpc('is_ip_suspicious', {
      _ip_address: clientIp
    });

    if (ipCheck && ipCheck[0]?.is_suspicious) {
      const analysis = ipCheck[0];
      
      // Registrar el intento bloqueado
      await supabase.rpc('log_and_analyze_login', {
        _ip_address: clientIp,
        _email: email,
        _success: false,
        _user_agent: userAgent
      });

      console.log(`Blocked suspicious IP: ${clientIp}, Reason: ${analysis.reason}`);

      return new Response(
        JSON.stringify({ 
          error: 'blocked_by_security',
          message: analysis.reason,
          anomaly_score: analysis.anomaly_score
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Intentar autenticación con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 3. Registrar el intento y analizar con ML (funciona para éxito y fallo)
    const { data: loginAnalysis } = await supabase.rpc('log_and_analyze_login', {
      _ip_address: clientIp,
      _email: email,
      _success: !authError,
      _user_agent: userAgent
    });

    console.log(`Login attempt logged. Success: ${!authError}, IP: ${clientIp}`);

    if (authError) {
      // Verificar si después del análisis ML se bloqueó el acceso
      if (loginAnalysis && loginAnalysis[0] && !loginAnalysis[0].allowed) {
        console.log(`Blocked by ML after attempt: ${loginAnalysis[0].reason}`);
        return new Response(
          JSON.stringify({ 
            error: 'blocked_by_ml',
            message: loginAnalysis[0].reason
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'auth_failed',
          message: authError.message 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Login exitoso
    return new Response(
      JSON.stringify({ 
        success: true,
        session: authData.session,
        user: authData.user
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in auth-login function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
