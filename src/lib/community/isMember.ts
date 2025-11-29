import { supabase } from "@/integrations/supabase/client";

export async function isMember(communityId: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data, error } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) return false;
  return !!data;
}
