import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, AlertTriangle, Clock, RefreshCw, Shield, Download, Bell, CheckCircle, XCircle } from "lucide-react";
import { PGPStorage, type StoredKeyPair } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface KeyExpirationInfo {
  keyPair: StoredKeyPair;
  status: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  expirationDate?: Date;
  daysUntilExpiration?: number;
  ageInDays: number;
  recommendation: string;
}

interface ExpirationSettings {
  warningDays: number;
  autoRenewalEnabled: boolean;
  notificationsEnabled: boolean;
  maxKeyAge: number; // in years
}

export default function KeyExpiration() {
  const [expirationInfo, setExpirationInfo] = useState<KeyExpirationInfo[]>([]);
  const [settings, setSettings] = useState<ExpirationSettings>({
    warningDays: 30,
    autoRenewalEnabled: false,
    notificationsEnabled: true,
    maxKeyAge: 4
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedKeyForRenewal, setSelectedKeyForRenewal] = useState<StoredKeyPair | null>(null);

  const { toast } = useToast();

  const analyzeKeyExpiration = async () => {
    setIsAnalyzing(true);
    
    try {
      const keyPairs = PGPStorage.getKeyPairs();
      const analysisResults: KeyExpirationInfo[] = [];
      
      for (const keyPair of keyPairs) {
        const keyAge = Date.now() - keyPair.keyInfo.created.getTime();
        const ageInDays = Math.floor(keyAge / (24 * 60 * 60 * 1000));
        const ageInYears = ageInDays / 365;
        
        let status: KeyExpirationInfo['status'] = 'valid';
        let recommendation = 'Key is in good condition.';
        let expirationDate: Date | undefined;
        let daysUntilExpiration: number | undefined;

        // Simulate key expiration analysis
        // In a real implementation, you would parse the actual key expiration from OpenPGP
        
        // For demonstration, we'll use key age as a proxy for expiration
        const estimatedExpirationYears = 5; // Assume keys are valid for 5 years
        expirationDate = new Date(keyPair.keyInfo.created.getTime() + estimatedExpirationYears * 365 * 24 * 60 * 60 * 1000);
        daysUntilExpiration = Math.floor((expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

        if (daysUntilExpiration < 0) {
          status = 'expired';
          recommendation = 'Key has expired. Generate a new key immediately and notify contacts.';
        } else if (daysUntilExpiration <= settings.warningDays) {
          status = 'expiring_soon';
          recommendation = `Key expires in ${daysUntilExpiration} days. Plan for renewal soon.`;
        } else if (ageInYears >= settings.maxKeyAge) {
          status = 'expiring_soon';
          recommendation = `Key is ${ageInYears.toFixed(1)} years old. Consider renewal for security best practices.`;
        }

        // Additional checks based on key strength and age
        if (keyPair.keyInfo.keySize < 2048) {
          status = 'expired';
          recommendation = 'Key uses weak encryption (< 2048 bits). Replace immediately with a stronger key.';
        }

        analysisResults.push({
          keyPair,
          status,
          expirationDate,
          daysUntilExpiration,
          ageInDays,
          recommendation
        });
      }

      setExpirationInfo(analysisResults);
      
      // Show notifications for critical issues
      const expiredKeys = analysisResults.filter(info => info.status === 'expired');
      const expiringSoon = analysisResults.filter(info => info.status === 'expiring_soon');
      
      if (expiredKeys.length > 0) {
        toast({
          title: "Expired Keys Detected",
          description: `${expiredKeys.length} key(s) have expired and need immediate attention.`,
          variant: "destructive"
        });
      } else if (expiringSoon.length > 0) {
        toast({
          title: "Keys Expiring Soon",
          description: `${expiringSoon.length} key(s) will expire within ${settings.warningDays} days.`,
        });
      } else {
        toast({
          title: "All Keys Valid",
          description: "No expiration issues detected.",
        });
      }
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: KeyExpirationInfo['status']) => {
    switch (status) {
      case 'valid': return 'success';
      case 'expiring_soon': return 'default';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: KeyExpirationInfo['status']) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expiring_soon': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'expired': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const renewKey = (keyPair: StoredKeyPair) => {
    setSelectedKeyForRenewal(keyPair);
    setShowRenewalDialog(true);
  };

  const exportExpirationReport = () => {
    const report = {
      generated: new Date().toISOString(),
      settings,
      summary: {
        total_keys: expirationInfo.length,
        expired_keys: expirationInfo.filter(info => info.status === 'expired').length,
        expiring_soon: expirationInfo.filter(info => info.status === 'expiring_soon').length,
        valid_keys: expirationInfo.filter(info => info.status === 'valid').length
      },
      key_details: expirationInfo.map(info => ({
        name: info.keyPair.keyInfo.name,
        email: info.keyPair.keyInfo.email,
        keyId: info.keyPair.keyInfo.keyId,
        created: info.keyPair.keyInfo.created,
        status: info.status,
        expiration_date: info.expirationDate,
        days_until_expiration: info.daysUntilExpiration,
        age_in_days: info.ageInDays,
        recommendation: info.recommendation
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `key-expiration-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Key expiration report has been downloaded.",
    });
  };

  const expirationSummary = useMemo(() => {
    const total = expirationInfo.length;
    const expired = expirationInfo.filter(info => info.status === 'expired').length;
    const expiringSoon = expirationInfo.filter(info => info.status === 'expiring_soon').length;
    const valid = expirationInfo.filter(info => info.status === 'valid').length;
    
    return { total, expired, expiringSoon, valid };
  }, [expirationInfo]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <span>Key Expiration Management</span>
          </CardTitle>
          <CardDescription>
            Monitor and manage PGP key expiration dates to maintain secure communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Key Details</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Expiration Status</h3>
                <div className="flex space-x-2">
                  <Button 
                    onClick={analyzeKeyExpiration} 
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Calendar className="h-4 w-4 mr-2" />
                    )}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Keys'}
                  </Button>
                  {expirationInfo.length > 0 && (
                    <Button variant="outline" onClick={exportExpirationReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  )}
                </div>
              </div>

              {expirationInfo.length > 0 && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{expirationSummary.total}</div>
                        <div className="text-sm text-gray-600">Total Keys</div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-red-600">{expirationSummary.expired}</div>
                        <div className="text-sm text-gray-600">Expired</div>
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-200">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{expirationSummary.expiringSoon}</div>
                        <div className="text-sm text-gray-600">Expiring Soon</div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200">
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600">{expirationSummary.valid}</div>
                        <div className="text-sm text-gray-600">Valid</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Health Progress */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Key Health Score</span>
                          <span>{Math.round((expirationSummary.valid / expirationSummary.total) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(expirationSummary.valid / expirationSummary.total) * 100} 
                          className="w-full" 
                        />
                        <p className="text-xs text-gray-500">
                          {expirationSummary.valid} of {expirationSummary.total} keys are in good condition
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Critical Alerts */}
                  {expirationSummary.expired > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Critical:</strong> {expirationSummary.expired} key(s) have expired. 
                        Generate new keys immediately and notify your contacts.
                      </AlertDescription>
                    </Alert>
                  )}

                  {expirationSummary.expiringSoon > 0 && expirationSummary.expired === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warning:</strong> {expirationSummary.expiringSoon} key(s) will expire soon. 
                        Plan for renewal to avoid communication disruption.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Key Expiration Details</h3>
              
              {expirationInfo.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Run the key analysis to view expiration details</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expirationInfo
                    .sort((a, b) => {
                      // Sort by urgency: expired, expiring soon, then valid
                      const statusOrder = { 'expired': 0, 'expiring_soon': 1, 'valid': 2, 'unknown': 3 };
                      return statusOrder[a.status] - statusOrder[b.status];
                    })
                    .map((info) => (
                      <Card key={info.keyPair.id} className={`border-l-4 ${
                        info.status === 'expired' ? 'border-l-red-500' :
                        info.status === 'expiring_soon' ? 'border-l-yellow-500' :
                        'border-l-green-500'
                      }`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(info.status)}
                                <span className="font-medium">{info.keyPair.keyInfo.name}</span>
                                <Badge variant={getStatusColor(info.status)}>
                                  {info.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <strong>Email:</strong> {info.keyPair.keyInfo.email}
                                </div>
                                <div>
                                  <strong>Key ID:</strong> {info.keyPair.keyInfo.keyId.substring(0, 16)}
                                </div>
                                <div>
                                  <strong>Created:</strong> {formatDate(info.keyPair.keyInfo.created)}
                                </div>
                                <div>
                                  <strong>Age:</strong> {Math.floor(info.ageInDays / 365)} years, {info.ageInDays % 365} days
                                </div>
                                {info.expirationDate && (
                                  <div>
                                    <strong>Expires:</strong> {formatDate(info.expirationDate)}
                                  </div>
                                )}
                                {info.daysUntilExpiration !== undefined && (
                                  <div>
                                    <strong>Days Until Expiration:</strong> {info.daysUntilExpiration > 0 ? info.daysUntilExpiration : 'Expired'}
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-sm font-medium text-blue-600">
                                <strong>Recommendation:</strong> {info.recommendation}
                              </p>
                            </div>
                            
                            <div className="flex space-x-2">
                              {(info.status === 'expired' || info.status === 'expiring_soon') && (
                                <Button size="sm" onClick={() => renewKey(info.keyPair)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Renew
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Expiration Settings</h3>
              
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Warning Period (days before expiration)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.warningDays}
                        onChange={(e) => setSettings({...settings, warningDays: parseInt(e.target.value) || 30})}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500">
                        Show warnings when keys will expire within this many days
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Key Age (years)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.maxKeyAge}
                        onChange={(e) => setSettings({...settings, maxKeyAge: parseInt(e.target.value) || 4})}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500">
                        Recommend renewal after this many years for security best practices
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.notificationsEnabled}
                          onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
                        />
                        <span className="text-sm font-medium">Enable expiration notifications</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.autoRenewalEnabled}
                          onChange={(e) => setSettings({...settings, autoRenewalEnabled: e.target.checked})}
                        />
                        <span className="text-sm font-medium">Auto-renewal reminders (coming soon)</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Best Practice:</strong> Set up regular key rotation every 2-4 years and monitor 
                    expiration dates monthly. Keep your contacts informed when updating keys.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Key Renewal Dialog */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Key: {selectedKeyForRenewal?.keyInfo.name}</DialogTitle>
            <DialogDescription>
              This will guide you through generating a new key to replace the expiring one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Key renewal involves generating a new key pair and notifying contacts. 
                Your old key should be marked as expired after the transition period.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h4 className="font-medium">Renewal Steps:</h4>
              <ol className="list-decimal list-inside text-sm space-y-1 text-gray-600">
                <li>Generate a new key pair with the same identity</li>
                <li>Export the new public key</li>
                <li>Notify all contacts about the key change</li>
                <li>Update key servers with the new key</li>
                <li>Keep the old key for a transition period</li>
                <li>Revoke the old key after transition</li>
              </ol>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => {
                setShowRenewalDialog(false);
                toast({
                  title: "Renewal Guide",
                  description: "Visit the Key Generation tab to create a replacement key.",
                });
              }}>
                Start Key Generation
              </Button>
              <Button variant="outline" onClick={() => setShowRenewalDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}