-- Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
  ON rate_limits(identifier, endpoint, window_start DESC);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON rate_limits(window_start);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_allowed BOOLEAN;
BEGIN
  -- Calculate current window start (rounded to nearest minute)
  v_window_start := date_trunc('minute', NOW());
  
  -- Get or create rate limit record
  INSERT INTO rate_limits (identifier, endpoint, count, window_start, updated_at)
  VALUES (p_identifier, p_endpoint, 1, v_window_start, NOW())
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    count = rate_limits.count + 1,
    updated_at = NOW()
  RETURNING count, window_start INTO v_count, v_window_start;
  
  -- Calculate reset time
  v_reset_at := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if limit exceeded
  v_allowed := v_count <= p_max_requests;
  
  -- Clean up old records (older than 2 hours) - run periodically
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '2 hours';
  
  -- Return result
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'count', v_count,
    'limit', p_max_requests,
    'remaining', GREATEST(0, p_max_requests - v_count),
    'reset_at', v_reset_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Only service role can manage rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

