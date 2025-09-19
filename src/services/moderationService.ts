
import { supabase } from '@/integrations/supabase/client';

export interface Report {
  id: string;
  category: string;
  reason: string;
  description?: string;
  evidence_urls?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface PostReport extends Report {
  post_id: string;
  reported_by: string;
  post?: any;
}

export interface UserReport extends Report {
  reported_user_id: string;
  reported_by: string;
  user?: any;
}

export interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: 'user' | 'post' | 'community' | 'comment';
  target_id: string;
  action_type: 'warn' | 'mute' | 'ban' | 'remove_content' | 'suspend';
  reason: string;
  duration?: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
  reversed_at?: string;
  reversed_by?: string;
  reversal_reason?: string;
}

export interface AutoModerationRule {
  id: string;
  name: string;
  rule_type: 'keyword' | 'regex' | 'ml_toxicity' | 'spam_detection';
  pattern: string;
  action: 'flag' | 'remove' | 'shadowban';
  severity: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export class ModerationService {
  // Report Management
  static async createPostReport(reportData: {
    post_id: string;
    category: string;
    reason: string;
    description?: string;
    evidence_urls?: string[];
    severity?: string;
  }): Promise<PostReport> {
    const { data, error } = await supabase
      .from('post_reports')
      .insert({
        post_id: reportData.post_id,
        reported_by: (await supabase.auth.getUser()).data.user?.id!,
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        evidence_urls: reportData.evidence_urls,
        severity: reportData.severity || 'low'
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
      status: data.status as 'pending' | 'reviewing' | 'resolved' | 'dismissed'
    } as PostReport;
  }

  static async createUserReport(reportData: {
    reported_user_id: string;
    category: string;
    reason: string;
    description?: string;
    evidence_urls?: string[];
    severity?: string;
  }): Promise<UserReport> {
    const { data, error } = await supabase
      .from('user_reports')
      .insert({
        reported_user_id: reportData.reported_user_id,
        reported_by: (await supabase.auth.getUser()).data.user?.id!,
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        evidence_urls: reportData.evidence_urls,
        severity: reportData.severity || 'low'
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
      status: data.status as 'pending' | 'reviewing' | 'resolved' | 'dismissed'
    } as UserReport;
  }

  static async getPostReports(status?: string, page = 1, limit = 20): Promise<{
    reports: PostReport[];
    total: number;
  }> {
    let query = supabase
      .from('post_reports')
      .select(`
        *,
        posts!inner (
          id,
          title,
          content,
          user_id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const reports = (data || []).map(report => ({
      ...report,
      severity: report.severity as 'low' | 'medium' | 'high' | 'critical',
      status: report.status as 'pending' | 'reviewing' | 'resolved' | 'dismissed'
    })) as PostReport[];

    return {
      reports,
      total: count || 0
    };
  }

  static async getUserReports(status?: string, page = 1, limit = 20): Promise<{
    reports: UserReport[];
    total: number;
  }> {
    let query = supabase
      .from('user_reports')
      .select(`
        *,
        profiles!user_reports_reported_user_id_fkey (
          user_id,
          display_name,
          avatar_url,
          bio
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const reports = (data || []).map(report => ({
      ...report,
      severity: report.severity as 'low' | 'medium' | 'high' | 'critical',
      status: report.status as 'pending' | 'reviewing' | 'resolved' | 'dismissed'
    })) as UserReport[];

    return {
      reports,
      total: count || 0
    };
  }

  // Moderation Actions
  static async takeModerationAction(actionData: {
    target_type: 'user' | 'post' | 'community' | 'comment';
    target_id: string;
    action_type: 'warn' | 'mute' | 'ban' | 'remove_content' | 'suspend';
    reason: string;
    duration?: string;
    notes?: string;
  }): Promise<ModerationAction> {
    const user = await supabase.auth.getUser();
    const moderatorId = user.data.user?.id!;

    let expires_at = null;
    if (actionData.duration) {
      const now = new Date();
      const duration = parseInt(actionData.duration);
      expires_at = new Date(now.getTime() + duration * 60 * 60 * 1000).toISOString();
    }

    const { data, error } = await supabase
      .from('moderation_actions')
      .insert({
        moderator_id: moderatorId,
        target_type: actionData.target_type,
        target_id: actionData.target_id,
        action_type: actionData.action_type,
        reason: actionData.reason,
        duration: actionData.duration ? `${actionData.duration} hours` : null,
        expires_at,
        notes: actionData.notes
      })
      .select()
      .single();

    if (error) throw error;

    const typedData = {
      ...data,
      target_type: data.target_type as 'user' | 'post' | 'community' | 'comment',
      action_type: data.action_type as 'warn' | 'mute' | 'ban' | 'remove_content' | 'suspend'
    } as ModerationAction;

    // Execute the action
    await this.executeModerationAction(typedData);

    return typedData;
  }

  private static async executeModerationAction(action: ModerationAction) {
    switch (action.action_type) {
      case 'remove_content':
        if (action.target_type === 'post') {
          await supabase
            .from('posts')
            .delete()
            .eq('id', action.target_id);
        }
        break;
      case 'ban':
      case 'suspend':
        // Mark user as banned/suspended (would need user status field)
        break;
      case 'mute':
        // Implement muting logic
        break;
    }
  }

  static async getModerationActions(page = 1, limit = 20): Promise<{
    actions: ModerationAction[];
    total: number;
  }> {
    const { data, error, count } = await supabase
      .from('moderation_actions')
      .select(`
        *,
        moderator:profiles!moderation_actions_moderator_id_fkey (
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const actions = (data || []).map(action => ({
      ...action,
      target_type: action.target_type as 'user' | 'post' | 'community' | 'comment',
      action_type: action.action_type as 'warn' | 'mute' | 'ban' | 'remove_content' | 'suspend'
    })) as ModerationAction[];

    return {
      actions,
      total: count || 0
    };
  }

  // Auto Moderation Rules
  static async createAutoModerationRule(ruleData: {
    name: string;
    rule_type: 'keyword' | 'regex' | 'ml_toxicity' | 'spam_detection';
    pattern: string;
    action: 'flag' | 'remove' | 'shadowban';
    severity?: number;
  }): Promise<AutoModerationRule> {
    const { data, error } = await supabase
      .from('automated_moderation_rules')
      .insert({
        ...ruleData,
        created_by: (await supabase.auth.getUser()).data.user?.id!,
        severity: ruleData.severity || 1
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      rule_type: data.rule_type as 'keyword' | 'regex' | 'ml_toxicity' | 'spam_detection',
      action: data.action as 'flag' | 'remove' | 'shadowban'
    } as AutoModerationRule;
  }

  static async getAutoModerationRules(): Promise<AutoModerationRule[]> {
    const { data, error } = await supabase
      .from('automated_moderation_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(rule => ({
      ...rule,
      rule_type: rule.rule_type as 'keyword' | 'regex' | 'ml_toxicity' | 'spam_detection',
      action: rule.action as 'flag' | 'remove' | 'shadowban'
    })) as AutoModerationRule[];
  }

  static async updateAutoModerationRule(id: string, updates: Partial<AutoModerationRule>): Promise<AutoModerationRule> {
    const { data, error } = await supabase
      .from('automated_moderation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      rule_type: data.rule_type as 'keyword' | 'regex' | 'ml_toxicity' | 'spam_detection',
      action: data.action as 'flag' | 'remove' | 'shadowban'
    } as AutoModerationRule;
  }

  // Content Analysis
  static async analyzeContent(content: string, contentType: 'post' | 'comment'): Promise<{
    flags: string[];
    confidence: number;
    shouldBlock: boolean;
  }> {
    // Get active moderation rules
    const { data: rules } = await supabase
      .from('automated_moderation_rules')
      .select('*')
      .eq('is_active', true);

    const flags: string[] = [];
    let maxConfidence = 0;
    let shouldBlock = false;

    for (const rule of rules || []) {
      let matches = false;
      let confidence = 0;

      switch (rule.rule_type) {
        case 'keyword':
          const keywords = rule.pattern.split(',').map(k => k.trim().toLowerCase());
          matches = keywords.some(keyword => content.toLowerCase().includes(keyword));
          confidence = matches ? rule.severity * 0.2 : 0;
          break;
        case 'regex':
          const regex = new RegExp(rule.pattern, 'gi');
          matches = regex.test(content);
          confidence = matches ? rule.severity * 0.3 : 0;
          break;
        // Add more rule types as needed
      }

      if (matches) {
        flags.push(rule.name);
        maxConfidence = Math.max(maxConfidence, confidence);
        
        if (rule.action === 'remove' && confidence > 0.7) {
          shouldBlock = true;
        }
      }
    }

    return {
      flags,
      confidence: maxConfidence,
      shouldBlock
    };
  }

  static async resolveReport(reportId: string, reportType: 'post' | 'user', resolution: {
    status: 'resolved' | 'dismissed';
    notes?: string;
  }): Promise<void> {
    const table = reportType === 'post' ? 'post_reports' : 'user_reports';
    
    const { error } = await supabase
      .from(table)
      .update({
        status: resolution.status,
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id!,
        resolution_notes: resolution.notes
      })
      .eq('id', reportId);

    if (error) throw error;
  }
}
