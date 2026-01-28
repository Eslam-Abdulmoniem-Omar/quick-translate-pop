import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserUsage {
  id: string;
  user_id: string;
  request_type: 'transcribe' | 'translate';
  tokens_used: number;
  created_at: string;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  transcribeRequests: number;
  translateRequests: number;
  recentUsage: UserUsage[];
}

export function useUserUsage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { data: usageData, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (usageError) throw usageError;

      const usage = usageData || [];
      
      const stats: UsageStats = {
        totalRequests: usage.length,
        totalTokens: usage.reduce((sum, item) => sum + (item.tokens_used || 0), 0),
        transcribeRequests: usage.filter(item => item.request_type === 'transcribe').length,
        translateRequests: usage.filter(item => item.request_type === 'translate').length,
        recentUsage: usage.slice(0, 10),
      };

      setStats(stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchUsageStats };
}
