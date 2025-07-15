import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Download, RefreshCw, Activity, Eye } from "lucide-react";
import { PGPStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'key_generation' | 'encryption' | 'decryption' | 'key_import' | 'key_export' | 'signature' | 'verification';
  status: 'success' | 'failure' | 'warning';
  details: string;
  keyId?: string;
  fileName?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  detected: Date;
  resolved?: Date;
}

interface AuditResult {
  overall_score: number;
  issues: SecurityIssue[];
  key_health: {
    total_keys: number;
    weak_keys: number;
    expired_keys: number;
    expiring_soon: number;
  };
  usage_stats: {
    total_operations: number;
    failed_operations: number;
    last_activity: Date | null;
  };
}

export default function SecurityAudit() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showResolved, setShowResolved] = useState(false);

  const { toast } = useToast();

  // Load security events from localStorage
  useEffect(() => {
    loadSecurityEvents();
  }, []);

  const loadSecurityEvents = () => {
    try {
      const stored = localStorage.getItem('pgp-security-events');
      if (stored) {
        const events = JSON.parse(stored).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        setSecurityEvents(events);
      }
    } catch (error) {
      console.error('Failed to load security events:', error);
    }
  };

  const logSecurityEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ...event
    };

    const updatedEvents = [newEvent, ...securityEvents].slice(0, 1000); // Keep last 1000 events
    setSecurityEvents(updatedEvents);
    
    try {
      localStorage.setItem('pgp-security-events', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Failed to save security event:', error);
    }
  };

  const runSecurityAudit = async () => {
    setIsRunningAudit(true);
    setAuditProgress(0);

    try {
      // Simulate audit progress
      const auditSteps = [
        'Analyzing key strength...',
        'Checking key expiration...',
        'Reviewing usage patterns...',
        'Scanning for vulnerabilities...',
        'Generating recommendations...'
      ];

      for (let i = 0; i < auditSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAuditProgress(((i + 1) / auditSteps.length) * 100);
      }

      const result = await performSecurityAudit();
      setAuditResult(result);

      logSecurityEvent({
        type: 'verification',
        status: 'success',
        details: `Security audit completed. Score: ${result.overall_score}/100`
      });

      toast({
        title: "Security Audit Complete",
        description: `Overall security score: ${result.overall_score}/100`,
        variant: result.overall_score >= 80 ? "default" : "destructive"
      });
    } catch (error) {
      logSecurityEvent({
        type: 'verification',
        status: 'failure',
        details: `Security audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunningAudit(false);
      setAuditProgress(0);
    }
  };

  const performSecurityAudit = async (): Promise<AuditResult> => {
    const keyPairs = PGPStorage.getKeyPairs();
    const contacts = PGPStorage.getContactKeys();
    const issues: SecurityIssue[] = [];
    
    let score = 100;

    // Check key strength
    let weakKeys = 0;
    keyPairs.forEach(keyPair => {
      if (keyPair.keyInfo.keySize < 2048) {
        weakKeys++;
        issues.push({
          id: `weak-key-${keyPair.id}`,
          severity: 'high',
          category: 'Key Strength',
          title: 'Weak Key Detected',
          description: `Key "${keyPair.keyInfo.name}" uses ${keyPair.keyInfo.keySize} bits, which is below recommended strength.`,
          recommendation: 'Generate a new key with at least 2048 bits (4096 recommended).',
          detected: new Date()
        });
        score -= 15;
      }
    });

    // Check for expired keys
    let expiredKeys = 0;
    let expiringSoon = 0;
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Simulate key expiration checking (in real implementation, you'd parse key expiration from OpenPGP)
    keyPairs.forEach(keyPair => {
      const keyAge = now.getTime() - keyPair.keyInfo.created.getTime();
      const ageInYears = keyAge / (365 * 24 * 60 * 60 * 1000);
      
      if (ageInYears > 4) {
        expiredKeys++;
        issues.push({
          id: `expired-key-${keyPair.id}`,
          severity: 'medium',
          category: 'Key Expiration',
          title: 'Old Key Detected',
          description: `Key "${keyPair.keyInfo.name}" is over 4 years old and should be renewed.`,
          recommendation: 'Generate a new key and transition contacts to the new key.',
          detected: new Date()
        });
        score -= 10;
      } else if (ageInYears > 3.5) {
        expiringSoon++;
        issues.push({
          id: `expiring-key-${keyPair.id}`,
          severity: 'low',
          category: 'Key Expiration',
          title: 'Key Expiring Soon',
          description: `Key "${keyPair.keyInfo.name}" will need renewal within 6 months.`,
          recommendation: 'Plan for key renewal and notify contacts.',
          detected: new Date()
        });
        score -= 5;
      }
    });

    // Check usage patterns
    const failedOperations = securityEvents.filter(e => e.status === 'failure').length;
    const totalOperations = securityEvents.length;
    
    if (totalOperations > 0 && failedOperations / totalOperations > 0.1) {
      issues.push({
        id: 'high-failure-rate',
        severity: 'medium',
        category: 'Usage Patterns',
        title: 'High Failure Rate',
        description: `${((failedOperations / totalOperations) * 100).toFixed(1)}% of operations failed.`,
        recommendation: 'Review failed operations and ensure proper key management.',
        detected: new Date()
      });
      score -= 10;
    }

    // Check for security best practices
    if (keyPairs.length === 0) {
      issues.push({
        id: 'no-keys',
        severity: 'critical',
        category: 'Key Management',
        title: 'No Keys Generated',
        description: 'No PGP key pairs have been generated.',
        recommendation: 'Generate at least one strong PGP key pair for secure communication.',
        detected: new Date()
      });
      score -= 30;
    }

    if (contacts.length === 0 && keyPairs.length > 0) {
      issues.push({
        id: 'no-contacts',
        severity: 'low',
        category: 'Key Management',
        title: 'No Contact Keys',
        description: 'No contact public keys have been imported.',
        recommendation: 'Import public keys of contacts for encrypted communication.',
        detected: new Date()
      });
      score -= 5;
    }

    // Check localStorage security
    const storageSize = PGPStorage.getStorageStats().totalSize;
    if (storageSize > 5 * 1024 * 1024) { // 5MB
      issues.push({
        id: 'large-storage',
        severity: 'low',
        category: 'Storage',
        title: 'Large Storage Usage',
        description: 'Local storage usage is high. Consider cleaning up old data.',
        recommendation: 'Review and delete unnecessary keys or create a backup.',
        detected: new Date()
      });
      score -= 3;
    }

    return {
      overall_score: Math.max(0, Math.min(100, score)),
      issues,
      key_health: {
        total_keys: keyPairs.length,
        weak_keys: weakKeys,
        expired_keys: expiredKeys,
        expiring_soon: expiringSoon
      },
      usage_stats: {
        total_operations: totalOperations,
        failed_operations: failedOperations,
        last_activity: securityEvents.length > 0 ? securityEvents[0].timestamp : null
      }
    };
  };

  const getSeverityColor = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'key_generation': return <Shield className="h-4 w-4" />;
      case 'encryption': return <Eye className="h-4 w-4" />;
      case 'decryption': return <Eye className="h-4 w-4" />;
      case 'signature': return <CheckCircle className="h-4 w-4" />;
      case 'verification': return <Activity className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const exportAuditReport = () => {
    if (!auditResult) return;

    const report = {
      generated: new Date().toISOString(),
      overall_score: auditResult.overall_score,
      summary: {
        total_issues: auditResult.issues.length,
        critical_issues: auditResult.issues.filter(i => i.severity === 'critical').length,
        high_issues: auditResult.issues.filter(i => i.severity === 'high').length,
        key_health: auditResult.key_health,
        usage_stats: auditResult.usage_stats
      },
      issues: auditResult.issues,
      recent_events: securityEvents.slice(0, 100)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgp-security-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Security audit report has been downloaded.",
    });
  };

  const clearAuditLog = () => {
    if (window.confirm('Are you sure you want to clear the security audit log? This action cannot be undone.')) {
      setSecurityEvents([]);
      localStorage.removeItem('pgp-security-events');
      toast({
        title: "Audit Log Cleared",
        description: "All security events have been deleted.",
      });
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Add example events for demonstration
  useEffect(() => {
    if (securityEvents.length === 0) {
      // Add some example events
      const exampleEvents: SecurityEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 60000),
          type: 'encryption',
          status: 'success',
          details: 'Encrypted file: document.pdf',
          fileName: 'document.pdf'
        },
        {
          id: '2', 
          timestamp: new Date(Date.now() - 120000),
          type: 'key_generation',
          status: 'success',
          details: 'Generated new RSA 4096-bit key pair'
        }
      ];
      setSecurityEvents(exampleEvents);
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Security Audit Trail</span>
          </CardTitle>
          <CardDescription>
            Monitor security events and analyze the security posture of your PGP operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Security Overview</TabsTrigger>
              <TabsTrigger value="events">Event Log</TabsTrigger>
              <TabsTrigger value="issues">Security Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Security Assessment</h3>
                <div className="flex space-x-2">
                  <Button 
                    onClick={runSecurityAudit} 
                    disabled={isRunningAudit}
                  >
                    {isRunningAudit ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    {isRunningAudit ? 'Running Audit...' : 'Run Security Audit'}
                  </Button>
                  {auditResult && (
                    <Button variant="outline" onClick={exportAuditReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  )}
                </div>
              </div>

              {isRunningAudit && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Running security audit...</span>
                    <span>{Math.round(auditProgress)}%</span>
                  </div>
                  <Progress value={auditProgress} className="w-full" />
                </div>
              )}

              {auditResult && (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <Card className={`${auditResult.overall_score >= 80 ? 'border-green-200 bg-green-50' : auditResult.overall_score >= 60 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold">Overall Security Score</h4>
                          <p className="text-sm text-gray-600">Based on key strength, usage patterns, and best practices</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{auditResult.overall_score}/100</div>
                          <Badge variant={auditResult.overall_score >= 80 ? "success" : auditResult.overall_score >= 60 ? "default" : "destructive"}>
                            {auditResult.overall_score >= 80 ? "Excellent" : auditResult.overall_score >= 60 ? "Good" : "Needs Improvement"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Health Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{auditResult.key_health.total_keys}</div>
                        <div className="text-sm text-gray-600">Total Keys</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-red-600">{auditResult.key_health.weak_keys}</div>
                        <div className="text-sm text-gray-600">Weak Keys</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-orange-600">{auditResult.key_health.expired_keys}</div>
                        <div className="text-sm text-gray-600">Old Keys</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{auditResult.usage_stats.total_operations}</div>
                        <div className="text-sm text-gray-600">Total Operations</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Critical Issues */}
                  {auditResult.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Action Required:</strong> {auditResult.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length} critical/high severity security issues detected.
                        Please review the issues tab for details.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Security Event Log ({securityEvents.length})</h3>
                <Button variant="outline" onClick={clearAuditLog}>
                  Clear Log
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No security events recorded yet</p>
                  </div>
                ) : (
                  securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`p-1 rounded ${
                        event.status === 'success' ? 'bg-green-100 text-green-600' :
                        event.status === 'failure' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium capitalize">{event.type.replace('_', ' ')}</span>
                          <Badge variant={event.status === 'success' ? 'success' : event.status === 'failure' ? 'destructive' : 'default'}>
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{event.details}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{formatTimestamp(event.timestamp)}</span>
                          {event.fileName && <span>File: {event.fileName}</span>}
                          {event.keyId && <span>Key: {event.keyId.substring(0, 8)}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Security Issues</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showResolved}
                    onChange={(e) => setShowResolved(e.target.checked)}
                  />
                  <span className="text-sm">Show resolved issues</span>
                </label>
              </div>

              {auditResult ? (
                <div className="space-y-3">
                  {auditResult.issues
                    .filter(issue => showResolved || !issue.resolved)
                    .map((issue) => (
                      <Card key={issue.id} className="border-l-4 border-l-red-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant={getSeverityColor(issue.severity)}>
                                  {issue.severity.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{issue.title}</span>
                                <Badge variant="outline">{issue.category}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{issue.description}</p>
                              <p className="text-sm font-medium text-blue-600">
                                <strong>Recommendation:</strong> {issue.recommendation}
                              </p>
                              <p className="text-xs text-gray-500">
                                Detected: {formatTimestamp(issue.detected)}
                                {issue.resolved && ` • Resolved: ${formatTimestamp(issue.resolved)}`}
                              </p>
                            </div>
                            {issue.severity === 'critical' ? (
                              <XCircle className="h-6 w-6 text-red-600" />
                            ) : issue.severity === 'high' ? (
                              <AlertTriangle className="h-6 w-6 text-orange-600" />
                            ) : (
                              <CheckCircle className="h-6 w-6 text-yellow-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  
                  {auditResult.issues.filter(issue => showResolved || !issue.resolved).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No security issues detected</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Run a security audit to view issues</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}