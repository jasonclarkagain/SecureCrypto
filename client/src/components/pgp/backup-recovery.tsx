import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, RefreshCw, Archive, Shield, AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { PGPStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface BackupData {
  version: string;
  timestamp: string;
  keyPairs: any[];
  contactKeys: any[];
  settings: any;
  metadata: {
    totalKeys: number;
    exportedBy: string;
    application: string;
  };
}

interface RestoreResult {
  success: boolean;
  imported: {
    keyPairs: number;
    contactKeys: number;
  };
  errors: string[];
  warnings: string[];
}

export default function BackupRecovery() {
  const [activeTab, setActiveTab] = useState('backup');
  const [backupData, setBackupData] = useState<string>('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreInput, setRestoreInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  const { toast } = useToast();

  const createBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      // Simulate backup creation process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const keyPairs = PGPStorage.getKeyPairs();
      const contactKeys = PGPStorage.getContactKeys();
      
      const backup: BackupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        keyPairs: keyPairs.map(kp => ({
          id: kp.id,
          nickname: kp.nickname,
          publicKey: kp.publicKey,
          privateKey: kp.privateKey,
          keyInfo: kp.keyInfo
        })),
        contactKeys: contactKeys.map(ck => ({
          id: ck.id,
          name: ck.name,
          email: ck.email,
          publicKey: ck.publicKey,
          keyId: ck.keyId,
          created: ck.created,
          nickname: ck.nickname
        })),
        settings: {
          // Future: app settings
        },
        metadata: {
          totalKeys: keyPairs.length + contactKeys.length,
          exportedBy: "PGP Crypter",
          application: "pgp-crypter-v1.0.0"
        }
      };

      const backupJson = JSON.stringify(backup, null, 2);
      setBackupData(backupJson);
      
      toast({
        title: "Backup Created",
        description: `Successfully backed up ${backup.metadata.totalKeys} keys and settings.`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = () => {
    if (!backupData) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgp-crypter-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Backup file has been downloaded.",
    });
  };

  const validateBackupData = (data: string): { valid: boolean; backup?: BackupData; error?: string } => {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.version || !parsed.timestamp || !parsed.keyPairs || !parsed.contactKeys) {
        return { valid: false, error: "Invalid backup format - missing required fields" };
      }
      
      if (parsed.metadata?.application !== "pgp-crypter-v1.0.0") {
        return { valid: false, error: "Incompatible backup version or application" };
      }
      
      return { valid: true, backup: parsed };
    } catch (error) {
      return { valid: false, error: "Invalid JSON format" };
    }
  };

  const restoreFromBackup = async () => {
    if (!restoreInput.trim()) {
      toast({
        title: "Error",
        description: "Please paste backup data to restore.",
        variant: "destructive"
      });
      return;
    }

    const validation = validateBackupData(restoreInput);
    if (!validation.valid) {
      toast({
        title: "Invalid Backup",
        description: validation.error || "Unknown validation error",
        variant: "destructive"
      });
      return;
    }

    const backup = validation.backup!;
    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      const result: RestoreResult = {
        success: true,
        imported: { keyPairs: 0, contactKeys: 0 },
        errors: [],
        warnings: []
      };

      // Confirm with user before overwriting
      const confirmOverwrite = window.confirm(
        `This will restore ${backup.keyPairs.length} key pairs and ${backup.contactKeys.length} contact keys. ` +
        "Existing keys with the same ID will be overwritten. Continue?"
      );
      
      if (!confirmOverwrite) {
        setIsRestoring(false);
        return;
      }

      const totalItems = backup.keyPairs.length + backup.contactKeys.length;
      let processedItems = 0;

      // Restore key pairs
      for (const keyPair of backup.keyPairs) {
        try {
          // Validate key pair data
          if (!keyPair.publicKey || !keyPair.privateKey || !keyPair.keyInfo) {
            result.errors.push(`Invalid key pair data for ${keyPair.keyInfo?.name || 'unknown'}`);
            continue;
          }

          // Check if key already exists
          const existingKey = PGPStorage.getKeyPair(keyPair.id);
          if (existingKey) {
            result.warnings.push(`Overwriting existing key pair: ${keyPair.keyInfo.name}`);
          }

          // Restore the key pair (simulate localStorage operation)
          const keyPairs = PGPStorage.getKeyPairs();
          const filteredKeyPairs = keyPairs.filter(k => k.id !== keyPair.id);
          localStorage.setItem('pgp-keypairs', JSON.stringify([...filteredKeyPairs, keyPair]));
          
          result.imported.keyPairs++;
        } catch (error) {
          result.errors.push(`Failed to restore key pair: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
        
        processedItems++;
        setRestoreProgress((processedItems / totalItems) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Restore contact keys
      for (const contactKey of backup.contactKeys) {
        try {
          // Validate contact key data
          if (!contactKey.publicKey || !contactKey.name || !contactKey.email) {
            result.errors.push(`Invalid contact key data for ${contactKey.name || 'unknown'}`);
            continue;
          }

          // Check if contact already exists
          const existingContact = PGPStorage.getContactKey(contactKey.id);
          if (existingContact) {
            result.warnings.push(`Overwriting existing contact: ${contactKey.name}`);
          }

          // Restore the contact key
          const contactKeys = PGPStorage.getContactKeys();
          const filteredContactKeys = contactKeys.filter(k => k.id !== contactKey.id);
          localStorage.setItem('pgp-contacts', JSON.stringify([...filteredContactKeys, contactKey]));
          
          result.imported.contactKeys++;
        } catch (error) {
          result.errors.push(`Failed to restore contact: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
        
        processedItems++;
        setRestoreProgress((processedItems / totalItems) * 100);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setRestoreResult(result);
      
      if (result.errors.length === 0) {
        toast({
          title: "Restore Complete",
          description: `Successfully restored ${result.imported.keyPairs} key pairs and ${result.imported.contactKeys} contacts.`,
        });
      } else {
        toast({
          title: "Restore Completed with Errors",
          description: `${result.errors.length} items failed to restore. Check the details below.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Restore Failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const clearAllData = () => {
    const confirm = window.confirm(
      "This will permanently delete ALL your keys and data. This action cannot be undone. Are you sure?"
    );
    
    if (confirm) {
      const doubleConfirm = window.confirm(
        "FINAL WARNING: You are about to delete everything. Have you made a backup? This is irreversible!"
      );
      
      if (doubleConfirm) {
        PGPStorage.clearAllData();
        toast({
          title: "Data Cleared",
          description: "All keys and data have been permanently deleted.",
          variant: "destructive"
        });
      }
    }
  };

  const getStorageStats = () => {
    return PGPStorage.getStorageStats();
  };

  const stats = getStorageStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="h-6 w-6" />
            <span>Backup & Recovery</span>
          </CardTitle>
          <CardDescription>
            Securely backup and restore your keys, contacts, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Storage Statistics */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Current Storage</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Key Pairs</div>
                <div className="font-mono text-lg">{stats.keyPairs}</div>
              </div>
              <div>
                <div className="text-gray-600">Contacts</div>
                <div className="font-mono text-lg">{stats.contacts}</div>
              </div>
              <div>
                <div className="text-gray-600">Total Size</div>
                <div className="font-mono text-lg">{(stats.totalSize / 1024).toFixed(1)}KB</div>
              </div>
              <div>
                <div className="text-gray-600">Last Backup</div>
                <div className="font-mono text-sm">{stats.lastBackup || 'Never'}</div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="backup">Create Backup</TabsTrigger>
              <TabsTrigger value="restore">Restore Data</TabsTrigger>
            </TabsList>

            <TabsContent value="backup" className="space-y-4 mt-6">
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Backup files contain your private keys in encrypted form. 
                    Store them securely and never share them publicly.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={createBackup} 
                    disabled={isCreatingBackup}
                    className="flex items-center space-x-2"
                  >
                    {isCreatingBackup ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    <span>{isCreatingBackup ? 'Creating...' : 'Create Backup'}</span>
                  </Button>
                  
                  {backupData && (
                    <Button variant="outline" onClick={downloadBackup}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </Button>
                  )}
                </div>

                {backupData && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Backup Data (JSON)</label>
                    <Textarea
                      value={backupData}
                      readOnly
                      rows={10}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500">
                      Save this backup file securely. You can use it to restore your data later.
                    </p>
                  </div>
                )}

                <Alert>
                  <AlertDescription>
                    <strong>Backup Includes:</strong> All your key pairs, contact public keys, and application settings. 
                    Private keys are included in their encrypted form with your passphrases.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="restore" className="space-y-4 mt-6">
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Restoring will overwrite existing keys with the same IDs. 
                    Create a backup first if you want to preserve current data.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Backup Data</label>
                  <Textarea
                    placeholder="Paste your backup JSON data here..."
                    value={restoreInput}
                    onChange={(e) => setRestoreInput(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                {isRestoring && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Restoring data...</span>
                      <span>{Math.round(restoreProgress)}%</span>
                    </div>
                    <Progress value={restoreProgress} className="w-full" />
                  </div>
                )}

                <Button 
                  onClick={restoreFromBackup} 
                  disabled={!restoreInput.trim() || isRestoring}
                  className="flex items-center space-x-2"
                >
                  {isRestoring ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{isRestoring ? 'Restoring...' : 'Restore from Backup'}</span>
                </Button>

                {restoreResult && (
                  <Card className={`${restoreResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        {restoreResult.success ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={restoreResult.success ? "success" : "destructive"}>
                              {restoreResult.success ? "Restore Completed" : "Restore Failed"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <p><strong>Imported:</strong> {restoreResult.imported.keyPairs} key pairs, {restoreResult.imported.contactKeys} contacts</p>
                            
                            {restoreResult.warnings.length > 0 && (
                              <div>
                                <strong>Warnings:</strong>
                                <ul className="list-disc list-inside text-yellow-700 ml-2">
                                  {restoreResult.warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {restoreResult.errors.length > 0 && (
                              <div>
                                <strong>Errors:</strong>
                                <ul className="list-disc list-inside text-red-700 ml-2">
                                  {restoreResult.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="pt-6 border-t">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-red-700">Danger Zone</h3>
                    <p className="text-sm text-gray-600">
                      Permanently delete all your data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={clearAllData}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}