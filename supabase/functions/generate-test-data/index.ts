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

    const { count = 100, mode = 'normal' } = await req.json();

    console.log(`Generating ${count} login attempts in ${mode} mode`);

    const testIPs = [
      '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
      '10.0.0.50', '10.0.0.51', '10.0.0.52',
      '172.16.0.10', '172.16.0.11'
    ];

    const attackerIPs = [
      '185.220.101.1', '185.220.101.2', '45.155.205.1',
      '23.129.64.1', '198.98.57.1'
    ];

    const testEmails = [
      'user1@example.com', 'user2@example.com', 'admin@example.com',
      'test@example.com', 'demo@example.com'
    ];

    const attackEmails = [
      'admin', 'root', 'administrator', 'user', 'test',
      'admin@admin.com', 'root@root.com', 'test@test.com'
    ];

    const attempts = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const isAttacker = mode === 'attack' || (mode === 'mixed' && Math.random() > 0.7);
      
      let ip, email, success, attemptsInMinute;
      
      if (isAttacker) {
        // Attacker behavior: 10-150 requests per minute
        attemptsInMinute = Math.floor(Math.random() * 140) + 10;
        ip = attackerIPs[Math.floor(Math.random() * attackerIPs.length)];
        email = attackEmails[Math.floor(Math.random() * attackEmails.length)];
        success = Math.random() > 0.95; // 5% success rate for attackers
        
        // Generate multiple attempts for attacker
        for (let j = 0; j < attemptsInMinute; j++) {
          const timestamp = new Date(now.getTime() - (i * 60000) - (j * (60000 / attemptsInMinute)));
          attempts.push({
            ip_address: ip,
            email: Math.random() > 0.3 ? email : attackEmails[Math.floor(Math.random() * attackEmails.length)],
            success: Math.random() > 0.95,
            attempted_at: timestamp.toISOString(),
            user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          });
        }
      } else {
        // Normal user behavior: 1-9 requests per minute
        attemptsInMinute = Math.floor(Math.random() * 9) + 1;
        ip = testIPs[Math.floor(Math.random() * testIPs.length)];
        email = testEmails[Math.floor(Math.random() * testEmails.length)];
        
        for (let j = 0; j < attemptsInMinute; j++) {
          const timestamp = new Date(now.getTime() - (i * 60000) - (j * (60000 / attemptsInMinute)));
          success = j === attemptsInMinute - 1 ? true : Math.random() > 0.8; // Last attempt usually succeeds
          
          attempts.push({
            ip_address: ip,
            email: email,
            success: success,
            attempted_at: timestamp.toISOString(),
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          });
        }
      }
    }

    // Mark all test data with is_test_data flag
    const attemptsWithTestFlag = attempts.map(attempt => ({
      ...attempt,
      is_test_data: true
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < attemptsWithTestFlag.length; i += batchSize) {
      const batch = attemptsWithTestFlag.slice(i, i + batchSize);
      const { error } = await supabase
        .from('login_attempts')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
    }

    console.log(`Successfully generated ${attempts.length} login attempts`);

    return new Response(
      JSON.stringify({ 
        success: true,
        attempts_generated: attempts.length,
        normal_ips: testIPs.length,
        attacker_ips: attackerIPs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating test data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
