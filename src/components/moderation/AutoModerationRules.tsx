
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Settings, Shield } from 'lucide-react';
import { useModeration } from '@/hooks/useModeration';

const RULE_TYPES = {
  keyword: 'Keyword Detection',
  regex: 'Regular Expression',
  ml_toxicity: 'ML Toxicity Detection',
  spam_detection: 'Spam Detection'
};

const RULE_ACTIONS = {
  flag: 'Flag for Review',
  remove: 'Auto Remove',
  shadowban: 'Shadow Ban'
};

export const AutoModerationRules: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    rule_type: 'keyword' as any,
    pattern: '',
    action: 'flag' as any,
    severity: 1
  });

  const { autoRules, loadingAutoRules, createAutoRule, creatingAutoRule } = useModeration();

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRule.name || !newRule.pattern) return;

    createAutoRule(newRule);
    
    // Reset form
    setNewRule({
      name: '',
      rule_type: 'keyword',
      pattern: '',
      action: 'flag',
      severity: 1
    });
    setIsCreateModalOpen(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'shadowban':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 3) return 'bg-red-100 text-red-800';
    if (severity >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auto Moderation Rules</h2>
          <p className="text-muted-foreground">
            Configure automated content filtering and moderation
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Auto Moderation Rule</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Profanity Filter"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rule_type">Rule Type</Label>
                <Select
                  value={newRule.rule_type}
                  onValueChange={(value) => setNewRule({ ...newRule, rule_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RULE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pattern">Pattern</Label>
                <Textarea
                  id="pattern"
                  placeholder={
                    newRule.rule_type === 'keyword' 
                      ? 'Enter keywords separated by commas'
                      : newRule.rule_type === 'regex'
                      ? 'Enter regular expression pattern'
                      : 'Pattern configuration'
                  }
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="action">Action</Label>
                <Select
                  value={newRule.action}
                  onValueChange={(value) => setNewRule({ ...newRule, action: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RULE_ACTIONS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity (1-5)</Label>
                <Input
                  id="severity"
                  type="number"
                  min="1"
                  max="5"
                  value={newRule.severity}
                  onChange={(e) => setNewRule({ ...newRule, severity: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingAutoRule}>
                  {creatingAutoRule ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingAutoRules ? (
        <div>Loading auto moderation rules...</div>
      ) : (
        <div className="grid gap-4">
          {autoRules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Auto Moderation Rules</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first auto moderation rule to start filtering content automatically.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            autoRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {RULE_TYPES[rule.rule_type as keyof typeof RULE_TYPES]}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={rule.is_active}
                      // onCheckedChange would trigger update function
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getActionColor(rule.action)}>
                        {RULE_ACTIONS[rule.action as keyof typeof RULE_ACTIONS]}
                      </Badge>
                      <Badge className={getSeverityColor(rule.severity)}>
                        Severity {rule.severity}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Pattern:</p>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {rule.pattern}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
