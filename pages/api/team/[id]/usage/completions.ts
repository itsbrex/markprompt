import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

import { Database } from '@/types/supabase';
import { DbTeam } from '@/types/types';

type Data =
  | {
      status?: string;
      error?: string;
    }
  | { occurrences: number };

const allowedMethods = ['GET'];

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createServerSupabaseClient<Database>({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const teamId = req.query.id as DbTeam['id'];

  if (req.method === 'GET') {
    const { data: occurrences, error } = await supabaseAdmin.rpc(
      'get_team_num_completions',
      {
        team_id: teamId,
        from_tz: req.query.from as string,
        to_tz: req.query.to as string,
      },
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!occurrences || occurrences.length === 0) {
      return res.status(404).json({ error: 'No results found.' });
    }

    return res.status(200).json({ occurrences: occurrences[0].occurrences });
  }

  return res.status(400).end();
}
