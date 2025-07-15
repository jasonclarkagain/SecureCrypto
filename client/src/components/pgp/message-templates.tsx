import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Edit, Trash2, Plus, FileText, Send, Star, Clock, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  subject?: string;
  content: string;
  variables: string[];
  isSecure: boolean;
  created: Date;
  lastUsed?: Date;
  useCount: number;
  tags: string[];
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Secure Document Transfer',
    category: 'business',
    subject: 'Encrypted Document: {{document_name}}',
    content: `Dear {{recipient_name}},

I'm sending you the encrypted document "{{document_name}}" as requested.

The document has been encrypted using PGP encryption for your security. Please use your private key to decrypt the attached file.

Document details:
- Name: {{document_name}}
- Date: {{current_date}}
- Encryption: PGP/OpenPGP

Please confirm receipt of this document.

Best regards,
{{sender_name}}`,
    variables: ['recipient_name', 'document_name', 'current_date', 'sender_name'],
    isSecure: true,
    created: new Date('2024-01-01'),
    useCount: 15,
    tags: ['business', 'documents', 'security']
  },
  {
    id: '2',
    name: 'Key Exchange Request',
    category: 'security',
    subject: 'PGP Key Exchange Request',
    content: `Hello {{recipient_name}},

I would like to establish secure communication with you using PGP encryption.

Please find my public key attached/below. Could you please send me your public key so we can communicate securely?

My key details:
- Name: {{sender_name}}
- Email: {{sender_email}}
- Key ID: {{key_id}}
- Fingerprint: {{fingerprint}}

You can verify this key through the following channels:
{{verification_channels}}

Looking forward to secure communication.

Best regards,
{{sender_name}}`,
    variables: ['recipient_name', 'sender_name', 'sender_email', 'key_id', 'fingerprint', 'verification_channels'],
    isSecure: true,
    created: new Date('2024-01-02'),
    useCount: 8,
    tags: ['security', 'key-exchange', 'setup']
  },
  {
    id: '3',
    name: 'Meeting Invitation (Confidential)',
    category: 'business',
    subject: 'Confidential: Meeting Invitation - {{meeting_topic}}',
    content: `Dear {{recipient_name}},

You are invited to a confidential meeting regarding {{meeting_topic}}.

Meeting Details:
- Date: {{meeting_date}}
- Time: {{meeting_time}}
- Location: {{meeting_location}}
- Duration: {{meeting_duration}}

Agenda:
{{meeting_agenda}}

This communication is confidential and encrypted for security purposes. Please do not forward or share this information.

Please confirm your attendance.

Best regards,
{{sender_name}}
{{sender_title}}`,
    variables: ['recipient_name', 'meeting_topic', 'meeting_date', 'meeting_time', 'meeting_location', 'meeting_duration', 'meeting_agenda', 'sender_name', 'sender_title'],
    isSecure: true,
    created: new Date('2024-01-03'),
    useCount: 12,
    tags: ['business', 'meetings', 'confidential']
  },
  {
    id: '4',
    name: 'Password Sharing',
    category: 'security',
    subject: 'Secure Password Information',
    content: `Hello {{recipient_name}},

I'm sharing the requested password information with you securely.

Service: {{service_name}}
Username: {{username}}
Password: {{password}}
Additional Notes: {{notes}}

Please:
1. Change this password immediately after first use
2. Store it in a secure password manager
3. Do not share this information with anyone else
4. Confirm receipt of this message

This password will expire on: {{expiry_date}}

Stay secure,
{{sender_name}}`,
    variables: ['recipient_name', 'service_name', 'username', 'password', 'notes', 'expiry_date', 'sender_name'],
    isSecure: true,
    created: new Date('2024-01-04'),
    useCount: 6,
    tags: ['security', 'passwords', 'credentials']
  },
  {
    id: '5',
    name: 'Project Update (Internal)',
    category: 'business',
    subject: 'Internal Project Update: {{project_name}}',
    content: `Team,

Here's the latest update on {{project_name}}:

Current Status: {{project_status}}
Completion: {{completion_percentage}}%

Recent Achievements:
{{recent_achievements}}

Upcoming Milestones:
{{upcoming_milestones}}

Challenges/Blockers:
{{challenges}}

Next Steps:
{{next_steps}}

Please review and provide your feedback by {{feedback_deadline}}.

Best,
{{sender_name}}
Project Manager`,
    variables: ['project_name', 'project_status', 'completion_percentage', 'recent_achievements', 'upcoming_milestones', 'challenges', 'next_steps', 'feedback_deadline', 'sender_name'],
    isSecure: false,
    created: new Date('2024-01-05'),
    useCount: 20,
    tags: ['business', 'projects', 'updates']
  }
];

export default function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate>>({});
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [processedMessage, setProcessedMessage] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

  const categories = ['all', 'business', 'security', 'personal', 'legal'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const processTemplate = (template: MessageTemplate, values: Record<string, string>): string => {
    let processed = template.content;
    
    // Add current date if needed
    values.current_date = new Date().toLocaleDateString();
    
    // Replace variables
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || `[${key}]`);
    });
    
    return processed;
  };

  const useTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setVariableValues({});
    setProcessedMessage('');
    setActiveTab('compose');
    
    // Update usage stats
    const updatedTemplates = templates.map(t => 
      t.id === template.id 
        ? { ...t, useCount: t.useCount + 1, lastUsed: new Date() }
        : t
    );
    setTemplates(updatedTemplates);
  };

  const generateMessage = () => {
    if (!selectedTemplate) return;
    
    const processed = processTemplate(selectedTemplate, variableValues);
    setProcessedMessage(processed);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(processedMessage);
    toast({
      title: "Copied",
      description: "Message copied to clipboard.",
    });
  };

  const saveAsNewTemplate = () => {
    if (!editingTemplate.name || !editingTemplate.content) {
      toast({
        title: "Error",
        description: "Please provide a name and content for the template.",
        variant: "destructive"
      });
      return;
    }

    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name: editingTemplate.name,
      category: editingTemplate.category || 'personal',
      subject: editingTemplate.subject,
      content: editingTemplate.content,
      variables: extractVariables(editingTemplate.content || ''),
      isSecure: editingTemplate.isSecure || false,
      created: new Date(),
      useCount: 0,
      tags: editingTemplate.tags || []
    };

    setTemplates([...templates, newTemplate]);
    setEditingTemplate({});
    setIsEditing(false);
    
    toast({
      title: "Template Saved",
      description: "New template has been created successfully.",
    });
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{{([^}]+)}}/g);
    if (!matches) return [];
    return [...new Set(matches.map(match => match.slice(2, -2)))];
  };

  const deleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
      toast({
        title: "Template Deleted",
        description: "Template has been permanently deleted.",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Message Templates</span>
          </CardTitle>
          <CardDescription>
            Create and use pre-defined message templates for secure communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse Templates</TabsTrigger>
              <TabsTrigger value="compose">Compose Message</TabsTrigger>
              <TabsTrigger value="create">Create Template</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4 mt-6">
              {/* Filters */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <span>{template.name}</span>
                            {template.isSecure && <Lock className="h-4 w-4 text-green-600" />}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{template.category}</Badge>
                            {template.useCount > 0 && (
                              <Badge variant="outline">
                                <Star className="h-3 w-3 mr-1" />
                                {template.useCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => useTemplate(template)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {template.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(template.created)}
                          </span>
                          {template.variables.length > 0 && (
                            <span>{template.variables.length} variables</span>
                          )}
                        </div>
                        {template.lastUsed && (
                          <span>Last used: {formatDate(template.lastUsed)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No templates found matching your criteria</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="compose" className="space-y-4 mt-6">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{selectedTemplate.name}</h3>
                    <Badge variant={selectedTemplate.isSecure ? "default" : "secondary"}>
                      {selectedTemplate.isSecure ? "Secure Template" : "Standard Template"}
                    </Badge>
                  </div>

                  {selectedTemplate.subject && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input 
                        value={processTemplate({ ...selectedTemplate, content: selectedTemplate.subject || '' }, variableValues)}
                        readOnly 
                      />
                    </div>
                  )}

                  {/* Variable Inputs */}
                  {selectedTemplate.variables.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Fill in Variables</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable} className="space-y-1">
                            <label className="text-sm font-medium capitalize">
                              {variable.replace(/_/g, ' ')}
                            </label>
                            <Input
                              placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                              value={variableValues[variable] || ''}
                              onChange={(e) => setVariableValues({
                                ...variableValues,
                                [variable]: e.target.value
                              })}
                            />
                          </div>
                        ))}
                      </div>
                      <Button onClick={generateMessage}>Generate Message</Button>
                    </div>
                  )}

                  {/* Preview */}
                  {processedMessage && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Generated Message</label>
                        <Button variant="outline" size="sm" onClick={copyMessage}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <Textarea
                        value={processedMessage}
                        readOnly
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  {selectedTemplate.isSecure && (
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        This is a secure template designed for encrypted communication. 
                        Make sure to encrypt this message before sending.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a template from the browse tab to compose a message</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      placeholder="Enter template name..."
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={editingTemplate.category || 'personal'} 
                      onValueChange={(value) => setEditingTemplate({...editingTemplate, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat !== 'all').map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject (Optional)</label>
                  <Input
                    placeholder="Enter email subject template..."
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Content</label>
                  <Textarea
                    placeholder="Enter your message template here. Use {{variable_name}} for variables..."
                    value={editingTemplate.content || ''}
                    onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                    rows={10}
                  />
                  <p className="text-xs text-gray-500">
                    Use {"{variable_name}"} syntax for variables. Example: Hello {"{recipient_name}"}, today is {"{current_date}"}.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingTemplate.isSecure || false}
                      onChange={(e) => setEditingTemplate({...editingTemplate, isSecure: e.target.checked})}
                    />
                    <span className="text-sm">Mark as secure template</span>
                  </label>
                </div>

                <Button onClick={saveAsNewTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save Template
                </Button>

                <Alert>
                  <AlertDescription>
                    <strong>Template Variables:</strong> Variables detected in your content will be automatically 
                    available when using the template. Common variables include: recipient_name, sender_name, 
                    current_date, document_name, etc.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}