import { createClient } from '@supabase/supabase-js';

// User provided credentials
const supabaseUrl = 'https://pylflzqzppxuasiflzxj.supabase.co';
const supabaseKey = 'sb_publishable_V5tluL7ocR5At1YA23FE6w_6bkV-lAi';

export const supabase = createClient(supabaseUrl, supabaseKey);
