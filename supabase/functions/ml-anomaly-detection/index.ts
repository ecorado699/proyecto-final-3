import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Isolation Forest implementation
class IsolationTree {
  private left: IsolationTree | null = null;
  private right: IsolationTree | null = null;
  private splitFeature: number = -1;
  private splitValue: number = 0;
  private size: number = 0;
  private isExternal: boolean = false;

  constructor(
    data: number[][],
    currentHeight: number,
    heightLimit: number
  ) {
    this.size = data.length;

    if (currentHeight >= heightLimit || data.length <= 1) {
      this.isExternal = true;
      return;
    }

    const numFeatures = data[0].length;
    this.splitFeature = Math.floor(Math.random() * numFeatures);

    const featureValues = data.map(row => row[this.splitFeature]);
    const min = Math.min(...featureValues);
    const max = Math.max(...featureValues);

    if (min === max) {
      this.isExternal = true;
      return;
    }

    this.splitValue = min + Math.random() * (max - min);

    const leftData = data.filter(row => row[this.splitFeature] < this.splitValue);
    const rightData = data.filter(row => row[this.splitFeature] >= this.splitValue);

    if (leftData.length === 0 || rightData.length === 0) {
      this.isExternal = true;
      return;
    }

    this.left = new IsolationTree(leftData, currentHeight + 1, heightLimit);
    this.right = new IsolationTree(rightData, currentHeight + 1, heightLimit);
  }

  pathLength(point: number[], currentHeight: number): number {
    if (this.isExternal) {
      return currentHeight + this.avgPathLength(this.size);
    }

    if (point[this.splitFeature] < this.splitValue) {
      return this.left!.pathLength(point, currentHeight + 1);
    } else {
      return this.right!.pathLength(point, currentHeight + 1);
    }
  }

  private avgPathLength(n: number): number {
    if (n <= 1) return 0;
    const H = Math.log(n - 1) + 0.5772156649;
    return 2 * H - (2 * (n - 1) / n);
  }
}

class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private sampleSize: number;
  private heightLimit: number;

  constructor(numTrees: number = 100, sampleSize: number = 256) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
    this.heightLimit = Math.ceil(Math.log2(sampleSize));
  }

  fit(data: number[][]): void {
    this.trees = [];
    for (let i = 0; i < this.numTrees; i++) {
      const sample = this.randomSample(data, Math.min(this.sampleSize, data.length));
      this.trees.push(new IsolationTree(sample, 0, this.heightLimit));
    }
  }

  predict(point: number[]): number {
    const avgPathLength = this.trees.reduce((sum, tree) => 
      sum + tree.pathLength(point, 0), 0) / this.trees.length;
    
    const c = this.avgPathLength(this.sampleSize);
    return Math.pow(2, -avgPathLength / c);
  }

  private randomSample(data: number[][], size: number): number[][] {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, size);
  }

  private avgPathLength(n: number): number {
    if (n <= 1) return 0;
    const H = Math.log(n - 1) + 0.5772156649;
    return 2 * H - (2 * (n - 1) / n);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'collect_metrics') {
      return await collectMetrics(supabase);
    } else if (action === 'train_model') {
      return await trainModel(supabase);
    } else if (action === 'detect_anomalies') {
      return await detectAnomalies(supabase);
    } else if (action === 'full_cycle') {
      // Run complete cycle: collect, train if needed, detect
      await collectMetrics(supabase);
      
      const { data: modelExists } = await supabase
        .from('ml_model_state')
        .select('id')
        .eq('is_active', true)
        .order('trained_at', { ascending: false })
        .limit(1)
        .single();

      if (!modelExists) {
        await trainModel(supabase);
      }
      
      return await detectAnomalies(supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ML anomaly detection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function collectMetrics(supabase: any) {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);

  // Get login attempts from the last minute grouped by IP
  const { data: attempts, error } = await supabase
    .from('login_attempts')
    .select('*')
    .gte('attempted_at', oneMinuteAgo.toISOString())
    .lte('attempted_at', now.toISOString());

  if (error) throw error;

  // Group by IP and calculate metrics
  const ipMetrics = new Map();

  for (const attempt of attempts || []) {
    const ip = attempt.ip_address;
    if (!ipMetrics.has(ip)) {
      ipMetrics.set(ip, {
        attempts: [],
        failed: 0,
        success: 0,
        emails: new Set()
      });
    }

    const metrics = ipMetrics.get(ip);
    metrics.attempts.push(new Date(attempt.attempted_at).getTime());
    if (attempt.success) {
      metrics.success++;
    } else {
      metrics.failed++;
    }
    if (attempt.email) {
      metrics.emails.add(attempt.email);
    }
  }

  // Calculate and insert metrics for each IP
  const metricsToInsert = [];
  
  for (const [ip, data] of ipMetrics.entries()) {
    const sortedTimes = data.attempts.sort((a, b) => a - b);
    const timeDiffs = [];
    for (let i = 1; i < sortedTimes.length; i++) {
      timeDiffs.push((sortedTimes[i] - sortedTimes[i - 1]) / 1000); // in seconds
    }

    const avgTime = timeDiffs.length > 0 
      ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length 
      : null;
    const minTime = timeDiffs.length > 0 ? Math.min(...timeDiffs) : null;
    const maxTime = timeDiffs.length > 0 ? Math.max(...timeDiffs) : null;

    const totalAttempts = data.failed + data.success;
    const errorRatio = totalAttempts > 0 ? data.failed / totalAttempts : 0;

    metricsToInsert.push({
      ip_address: ip,
      window_start: oneMinuteAgo.toISOString(),
      window_end: now.toISOString(),
      requests_per_minute: totalAttempts,
      failed_attempts: data.failed,
      success_attempts: data.success,
      error_ratio: errorRatio,
      avg_time_between_requests: avgTime,
      min_time_between_requests: minTime,
      max_time_between_requests: maxTime,
      unique_emails_tried: data.emails.size
    });
  }

  if (metricsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('ip_metrics')
      .insert(metricsToInsert);

    if (insertError) throw insertError;
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      metrics_collected: metricsToInsert.length,
      data: metricsToInsert 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function trainModel(supabase: any) {
  // Get historical metrics for training
  const { data: historicalData, error } = await supabase
    .from('ip_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw error;

  if (!historicalData || historicalData.length < 10) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Not enough data for training. Need at least 10 samples.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Prepare training data - normalize features
  const features = historicalData.map(m => [
    m.requests_per_minute / 100,  // Normalize to 0-1.5 range (assuming max 150)
    m.error_ratio,
    m.avg_time_between_requests ? Math.min(m.avg_time_between_requests / 60, 1) : 0.5,
    m.unique_emails_tried / 50,  // Normalize
  ]);

  // Train Isolation Forest
  const forest = new IsolationForest(100, Math.min(256, features.length));
  forest.fit(features);

  // Store model parameters (in a real implementation, you'd serialize the trees)
  const { error: saveError } = await supabase
    .from('ml_model_state')
    .insert({
      model_type: 'isolation_forest',
      training_data: {
        num_samples: features.length,
        date_range: {
          start: historicalData[historicalData.length - 1].created_at,
          end: historicalData[0].created_at
        }
      },
      parameters: {
        num_trees: 100,
        sample_size: Math.min(256, features.length),
        contamination: 0.1
      },
      metrics_summary: {
        avg_requests: historicalData.reduce((sum, m) => sum + m.requests_per_minute, 0) / historicalData.length,
        avg_error_ratio: historicalData.reduce((sum, m) => sum + m.error_ratio, 0) / historicalData.length
      }
    });

  if (saveError) throw saveError;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Model trained successfully',
      samples_used: features.length 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function detectAnomalies(supabase: any) {
  // Get recent metrics (last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 300000);
  
  const { data: recentMetrics, error } = await supabase
    .from('ip_metrics')
    .select('*')
    .gte('window_start', fiveMinutesAgo.toISOString())
    .order('window_start', { ascending: false });

  if (error) throw error;

  if (!recentMetrics || recentMetrics.length === 0) {
    return new Response(
      JSON.stringify({ success: true, anomalies_detected: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get training data to create the model
  const { data: trainingData } = await supabase
    .from('ip_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  const trainingFeatures = trainingData.map((m: any) => [
    m.requests_per_minute / 100,
    m.error_ratio,
    m.avg_time_between_requests ? Math.min(m.avg_time_between_requests / 60, 1) : 0.5,
    m.unique_emails_tried / 50,
  ]);

  const forest = new IsolationForest(100, Math.min(256, trainingFeatures.length));
  forest.fit(trainingFeatures);

  // Detect anomalies
  const anomalies = [];
  const threshold = 0.6;  // Anomaly score threshold

  for (const metric of recentMetrics) {
    const features = [
      metric.requests_per_minute / 100,
      metric.error_ratio,
      metric.avg_time_between_requests ? Math.min(metric.avg_time_between_requests / 60, 1) : 0.5,
      metric.unique_emails_tried / 50,
    ];

    const anomalyScore = forest.predict(features);
    // Ensure anomaly_score is never null - default to 0 if prediction fails
    const validScore = isNaN(anomalyScore) || anomalyScore === null || anomalyScore === undefined ? 0 : anomalyScore;
    const isAnomaly = validScore > threshold;

    anomalies.push({
      ip_address: metric.ip_address,
      detected_at: new Date().toISOString(),
      anomaly_score: validScore,
      is_anomaly: isAnomaly,
      metrics: {
        requests_per_minute: metric.requests_per_minute,
        error_ratio: metric.error_ratio,
        avg_time_between_requests: metric.avg_time_between_requests,
        unique_emails_tried: metric.unique_emails_tried
      },
      status: 'active'
    });
  }

  // Insert anomaly detections
  if (anomalies.length > 0) {
    const { error: insertError } = await supabase
      .from('anomaly_detections')
      .insert(anomalies);

    if (insertError) throw insertError;
  }

  const detectedAnomalies = anomalies.filter(a => a.is_anomaly);

  return new Response(
    JSON.stringify({ 
      success: true, 
      anomalies_detected: detectedAnomalies.length,
      total_checked: anomalies.length,
      anomalies: detectedAnomalies
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
