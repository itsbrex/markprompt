import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

import { track } from '@/lib/posthog';
import { safeParseNumber } from '@/lib/utils';
import { Database, Json } from '@/types/supabase';
import { Project } from '@/types/types';

// Admin access to Supabase, bypassing RLS.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

type FileSectionContentInfo = {
  content: string | null;
  path: string | null;
  file_meta: Json | null;
  section_meta: Json | null;
  project_id: string | null;
  source_data: Json | null;
  source_type: Database['public']['Enums']['source_type'] | null;
};

type Data =
  | {
      status?: string;
      error?: string;
    }
  | { data: FileSectionContentInfo[] };

const allowedMethods = ['GET'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  // Preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const params = req.body;
  const projectId = req.query.project as Project['id'];
  let config = {};
  try {
    config = JSON.parse((params.config || '') as string);
  } catch {
    // Do nothing
  }

  // if (!projectId) {
  //   console.error(`[INDEXES] Project not found`);
  //   return res.status(400).json({ error: 'Project not found' });
  // }

  // Apply rate limits, in additional to middleware rate limits.
  // const rateLimitResult = await checkSearchRateLimits({
  //   value: projectId,
  //   type: 'projectId',
  // });

  // TODO
  // if (!isRequestFromMarkprompt(req.headers.origin)) {
  //   // Search is part of the Enterprise plans when used outside of
  //   // the Markprompt dashboard.
  //   const teamStripeInfo = await getTeamStripeInfo(supabaseAdmin, projectId);
  //   if (
  //     !teamStripeInfo ||
  //     !isAtLeastPro(
  //       teamStripeInfo.stripePriceId,
  //       teamStripeInfo.isEnterprisePlan,
  //     )
  //   ) {
  //     return res.status(401).json({
  //       error: `The search endpoint is only accessible on the Pro and Enterprise plans. Please contact ${process.env.NEXT_PUBLIC_SALES_EMAIL} to get set up.`,
  //     });
  //   }
  // }

  const query = req.query.query as string;
  const limit = safeParseNumber(req.query.limit as string, 10);

  if (!query || query.trim() === '') {
    return res.status(200).json({
      data: [],
    });
  }

  const {
    data: fileSections,
    error,
  }: {
    data: FileSectionContentInfo[] | null | any;
    error: { message: string; code: string } | null;
  } = await supabaseAdmin
    .from('mv_file_section_search_infos')
    .select('content,section_meta')
    .like('content', `%${query}%`)
    .eq(
      req.query.token ? 'token' : 'public_api_key',
      req.query.token ?? req.query.projectKey,
    )
    .limit(limit);

  track(projectId, 'search', { projectId });

  if (error || !fileSections) {
    return res
      .status(safeParseNumber(error?.code, 400))
      .json({ error: error?.message || 'Error retrieving sections' });
  }

  return res.status(200).json({
    data: fileSections,
  });
}
