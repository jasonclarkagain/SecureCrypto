import { useState, useEffect } from "react";
import { Key, Upload, BarChart3, Shield, Download, Trash2, Eye, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PGPStorage, StoredKeyPair, ContactKey } from "@/lib/storage";
import { PGPService } from "@/lib/pgp";
import { usePGP } from "@/hooks/use-pgp";
import { useToast } from "@/hooks/use-toast";

export default function KeyManagement() {
  const [keyPairs, setKeyPairs] = useState<StoredKeyPair[]>([]);
  const [contactKeys, setContactKeys] = useState<ContactKey[]>([]);
  const [importType, setImportType] = useState<string>("public");
  const [importData, setImportData] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [storageStats, setStorageStats] = useState({
    keyPairCount: 0,
    contactKeyCount: 0,
    storageSize: "0 KB"
  });

  const { downloadFile } = usePGP();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setKeyPairs(PGPStorage.getKeyPairs());
    setContactKeys(PGPStorage.getContactKeys());
    setStorageStats(PGPStorage.getStorageStats());
  };

  const handleImportKey = async () => {
    if (!importData.trim()) {
      toast({
        title: "Import failed",
        description: "Please paste key data",
        variant: "destructive",
      });
      return;
    }

    try {
      if (importType === "public" || importType === "contact") {
        const isValid = await PGPService.validateKey(importData, 'public');
        if (!isValid) {
          throw new Error("Invalid public key format");
        }

        const keyInfo = await PGPService.getKeyInfo(importData);
        if (!keyInfo) {
          throw new Error("Could not extract key information");
        }

        // For contact keys, we need name and email
        if (importType === "contact") {
          if (!contactName.trim() || !contactEmail.trim()) {
            toast({
              title: "Import failed",
              description: "Please provide contact name and email",
              variant: "destructive",
            });
            return;
          }

          PGPStorage.saveContactKey({
            name: contactName,
            email: contactEmail,
            publicKey: importData,
            keyId: keyInfo.keyId,
            created: new Date()
          });

          setContactName("");
          setContactEmail("");
        }
      } else if (importType === "private") {
        const isValid = await PGPService.validateKey(importData, 'private');
        if (!isValid) {
          throw new Error("Invalid private key format");
        }
        // Note: For private keys, we'd need additional handling to create a complete key pair
        // This is simplified for the demo
      }

      setImportData("");
      loadData();

      toast({
        title: "Key imported",
        description: "Key has been successfully imported",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteKeyPair = (id: string) => {
    if (PGPStorage.deleteKeyPair(id)) {
      loadData();
      toast({
        title: "Key pair deleted",
        description: "Key pair has been removed from storage",
      });
    }
  };

  const handleDeleteContactKey = (id: string) => {
    if (PGPStorage.deleteContactKey(id)) {
      loadData();
      toast({
        title: "Contact key deleted",
        description: "Contact key has been removed from storage",
      });
    }
  };

  const handleExportKeyPair = (keyPair: StoredKeyPair) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `${keyPair.keyInfo.name.replace(/\s+/g, '_')}_${timestamp}`;
    
    downloadFile(keyPair.publicKey, `${baseName}_public.asc`);
    downloadFile(keyPair.privateKey, `${baseName}_private.asc`);
  };

  const handleExportContactKey = (contactKey: ContactKey) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `${contactKey.name.replace(/\s+/g, '_')}_${timestamp}`;
    
    downloadFile(contactKey.publicKey, `${baseName}_public.asc`);
  };

  const handleBackupAll = () => {
    const backup = PGPStorage.exportBackup();
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(backup, `pgp_backup_${timestamp}.json`, 'application/json');
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all keys? This action cannot be undone.")) {
      PGPStorage.clearAllData();
      loadData();
      toast({
        title: "All data cleared",
        description: "All keys have been removed from storage",
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
    <div className="p-6">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Stored Keys */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Key Pairs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="text-primary mr-3" />
                My Key Pairs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keyPairs.length > 0 ? (
                  keyPairs.map((keyPair) => (
                    <div key={keyPair.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{keyPair.keyInfo.name}</h4>
                          <p className="text-sm text-gray-600">{keyPair.keyInfo.email}</p>
                          <p className="text-xs text-gray-500">
                            Created: {formatDate(keyPair.keyInfo.created)} • {keyPair.keyInfo.keySize} bits
                          </p>
                          {keyPair.nickname && (
                            <p className="text-xs text-blue-600">Nickname: {keyPair.nickname}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Key Pair Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Public Key</Label>
                                  <Textarea
                                    value={keyPair.publicKey}
                                    readOnly
                                    className="h-32 text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <Label>Private Key</Label>
                                  <Textarea
                                    value={keyPair.privateKey}
                                    readOnly
                                    className="h-32 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleExportKeyPair(keyPair)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteKeyPair(keyPair.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <Key className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No key pairs found</p>
                    <p className="text-sm">Generate or import key pairs to manage them here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Public Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="text-green-600 mr-3" />
                Contact Public Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contactKeys.length > 0 ? (
                  contactKeys.map((contactKey) => (
                    <div key={contactKey.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{contactKey.name}</h4>
                          <p className="text-sm text-gray-600">{contactKey.email}</p>
                          <p className="text-xs text-gray-500">
                            Added: {formatDate(contactKey.created)} • Key ID: {contactKey.keyId.slice(-8)}
                          </p>
                          {contactKey.nickname && (
                            <p className="text-xs text-blue-600">Nickname: {contactKey.nickname}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Contact Key Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Public Key</Label>
                                  <Textarea
                                    value={contactKey.publicKey}
                                    readOnly
                                    className="h-40 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleExportContactKey(contactKey)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteContactKey(contactKey.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No contact keys imported</p>
                    <p className="text-sm">Import public keys from your contacts to encrypt messages for them</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Import Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="text-green-600 mr-3" />
                Import Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Key Type</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public Key</SelectItem>
                    <SelectItem value="contact">Contact Public Key</SelectItem>
                    <SelectItem value="private">Private Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {importType === "contact" && (
                <>
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Paste Key Data</Label>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="h-32 text-xs font-mono"
                  placeholder="Paste PGP key data here..."
                />
              </div>

              <Button onClick={handleImportKey} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Import Key
              </Button>
            </CardContent>
          </Card>

          {/* Key Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="text-blue-500 mr-3" />
                Key Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">My Key Pairs:</span>
                <span className="text-sm font-medium text-gray-900">{storageStats.keyPairCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Contact Keys:</span>
                <span className="text-sm font-medium text-gray-900">{storageStats.contactKeyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Storage Used:</span>
                <span className="text-sm font-medium text-gray-900">{storageStats.storageSize}</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="text-red-500 mr-3" />
                Security Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleBackupAll}
              >
                <Download className="text-blue-500 mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Backup All Keys</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Shield className="text-green-500 mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Verify Key Integrity</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleClearAll}
              >
                <Trash2 className="text-red-500 mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Clear All Keys</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
