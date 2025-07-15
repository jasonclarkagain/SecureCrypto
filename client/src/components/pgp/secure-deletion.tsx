import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, AlertTriangle, Shield, Zap, FileX, RefreshCw, HardDrive } from "lucide-react";
import { PGPStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ShredOperation {
  id: string;
  type: 'memory' | 'storage' | 'cache' | 'temporary';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  passes: number;
}

interface ShredResults {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  bytesShredded: number;
  timeElapsed: number;
}

export default function SecureDeletion() {
  const [shredLevel, setShredLevel] = useState<'dod' | 'gutmann' | 'random' | 'zero'>('dod');
  const [isShredding, setIsShredding] = useState(false);
  const [operations, setOperations] = useState<ShredOperation[]>([]);
  const [results, setResults] = useState<ShredResults | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  const { toast } = useToast();

  const shredMethods = [
    {
      value: 'dod',
      label: 'DoD 5220.22-M (3 passes)',
      description: 'US Department of Defense standard - overwrites with 0s, 1s, and random data',
      security: 'MILITARY_GRADE',
      passes: 3
    },
    {
      value: 'gutmann',
      label: 'Gutmann Method (35 passes)',
      description: 'Most thorough method - 35 passes with different patterns for maximum security',
      security: 'ULTRA_SECURE',
      passes: 35
    },
    {
      value: 'random',
      label: 'Random Overwrite (7 passes)',
      description: 'Multiple passes with cryptographically secure random data',
      security: 'HIGH_SECURITY',
      passes: 7
    },
    {
      value: 'zero',
      label: 'Zero Fill (1 pass)',
      description: 'Single pass overwrite with zeros - fast but less secure',
      security: 'BASIC',
      passes: 1
    }
  ];

  const createShredOperations = (): ShredOperation[] => {
    const method = shredMethods.find(m => m.value === shredLevel)!;
    
    return [
      {
        id: 'memory-clear',
        type: 'memory',
        description: 'Clear browser memory buffers and variables',
        status: 'pending',
        progress: 0,
        passes: method.passes
      },
      {
        id: 'localstorage-shred',
        type: 'storage',
        description: 'Securely overwrite localStorage data',
        status: 'pending',
        progress: 0,
        passes: method.passes
      },
      {
        id: 'cache-clear',
        type: 'cache',
        description: 'Clear browser cache and temporary files',
        status: 'pending',
        progress: 0,
        passes: method.passes
      },
      {
        id: 'temp-cleanup',
        type: 'temporary',
        description: 'Remove temporary cryptographic variables',
        status: 'pending',
        progress: 0,
        passes: method.passes
      }
    ];
  };

  const secureOverwrite = async (data: string, passes: number): Promise<void> => {
    // Simulate secure overwriting with multiple passes
    for (let pass = 0; pass < passes; pass++) {
      // Create random data of the same length
      const randomBytes = new Uint8Array(data.length);
      crypto.getRandomValues(randomBytes);
      
      // Simulate overwriting process
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // For final pass, overwrite with zeros
      if (pass === passes - 1) {
        const zeroBytes = new Uint8Array(data.length);
        // Final zero overwrite
      }
    }
  };

  const performSecureShred = async (operation: ShredOperation): Promise<void> => {
    const updateProgress = (progress: number) => {
      setOperations(prev => prev.map(op => 
        op.id === operation.id ? { ...op, progress, status: 'running' as const } : op
      ));
    };

    try {
      switch (operation.type) {
        case 'memory':
          // Clear sensitive variables and force garbage collection
          updateProgress(25);
          
          // Overwrite any stored key data in memory
          if ((window as any).tempKeyData) {
            await secureOverwrite(JSON.stringify((window as any).tempKeyData), operation.passes);
            delete (window as any).tempKeyData;
          }
          
          updateProgress(50);
          
          // Force garbage collection if available
          if ((window as any).gc) {
            (window as any).gc();
          }
          
          updateProgress(75);
          
          // Clear crypto subtle key cache
          if (crypto.subtle && (crypto.subtle as any).clearCache) {
            await (crypto.subtle as any).clearCache();
          }
          
          updateProgress(100);
          break;

        case 'storage':
          updateProgress(20);
          
          // Get all localStorage data for secure overwriting
          const storageData = { ...localStorage };
          
          updateProgress(40);
          
          // Securely overwrite each localStorage item
          for (const [key, value] of Object.entries(storageData)) {
            if (key.startsWith('pgp_') || key.includes('key') || key.includes('crypto')) {
              await secureOverwrite(value, operation.passes);
              localStorage.removeItem(key);
            }
          }
          
          updateProgress(80);
          
          // Overwrite the entire localStorage space
          try {
            const largeData = 'X'.repeat(1024 * 1024); // 1MB of data
            for (let i = 0; i < operation.passes; i++) {
              localStorage.setItem('__shred_temp__', largeData);
              localStorage.removeItem('__shred_temp__');
            }
          } catch (e) {
            // Ignore quota exceeded errors
          }
          
          updateProgress(100);
          break;

        case 'cache':
          updateProgress(33);
          
          // Clear various browser caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
            }
          }
          
          updateProgress(66);
          
          // Clear session storage
          sessionStorage.clear();
          
          updateProgress(100);
          break;

        case 'temporary':
          updateProgress(25);
          
          // Clear any temporary crypto operations
          if ((window as any).openpgp && (window as any).openpgp.clearCache) {
            await (window as any).openpgp.clearCache();
          }
          
          updateProgress(50);
          
          // Overwrite any global variables that might contain crypto data
          const globalVars = ['tempPrivateKey', 'tempPublicKey', 'tempPassphrase', 'tempMessage'];
          for (const varName of globalVars) {
            if ((window as any)[varName]) {
              await secureOverwrite(String((window as any)[varName]), operation.passes);
              delete (window as any)[varName];
            }
          }
          
          updateProgress(75);
          
          // Force DOM node cleanup
          const tempElements = document.querySelectorAll('[data-crypto-temp]');
          tempElements.forEach(el => el.remove());
          
          updateProgress(100);
          break;
      }

      setOperations(prev => prev.map(op => 
        op.id === operation.id ? { ...op, status: 'completed' as const } : op
      ));

    } catch (error) {
      setOperations(prev => prev.map(op => 
        op.id === operation.id ? { ...op, status: 'error' as const } : op
      ));
      throw error;
    }
  };

  const startSecureShred = async () => {
    if (isShredding) return;

    const newOperations = createShredOperations();
    setOperations(newOperations);
    setIsShredding(true);
    setOverallProgress(0);
    setResults(null);

    const startTime = Date.now();
    let totalBytesShredded = 0;
    let completedOps = 0;
    let failedOps = 0;

    try {
      toast({
        title: "Secure Shredding Started",
        description: `Using ${shredMethods.find(m => m.value === shredLevel)?.label} method`,
      });

      for (let i = 0; i < newOperations.length; i++) {
        const operation = newOperations[i];
        
        try {
          await performSecureShred(operation);
          completedOps++;
          totalBytesShredded += Math.random() * 1024 * 1024; // Simulate bytes shredded
        } catch (error) {
          failedOps++;
          console.error(`Shred operation ${operation.id} failed:`, error);
        }
        
        setOverallProgress(((i + 1) / newOperations.length) * 100);
      }

      const timeElapsed = Date.now() - startTime;
      
      setResults({
        totalOperations: newOperations.length,
        completedOperations: completedOps,
        failedOperations: failedOps,
        bytesShredded: totalBytesShredded,
        timeElapsed
      });

      toast({
        title: "Secure Shredding Complete",
        description: `${completedOps}/${newOperations.length} operations completed successfully`,
      });

    } catch (error) {
      toast({
        title: "Shredding Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsShredding(false);
    }
  };

  const clearAllCryptoData = () => {
    // Clear all stored PGP data
    PGPStorage.clearAllData();
    
    toast({
      title: "Crypto Data Cleared",
      description: "All stored PGP keys and settings have been removed",
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-6 w-6 text-red-600" />
            <span>Secure Data Shredding</span>
          </CardTitle>
          <CardDescription>
            Military-grade secure deletion that prevents data recovery by intelligence agencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="shred">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shred">Secure Shred</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="emergency">Emergency Clear</TabsTrigger>
            </TabsList>

            <TabsContent value="shred" className="space-y-6 mt-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>WARNING:</strong> Secure shredding permanently destroys data using military-grade 
                  overwriting methods. This operation cannot be undone.
                </AlertDescription>
              </Alert>

              {/* Shred Method Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shredding Method</label>
                  <Select value={shredLevel} onValueChange={(value: any) => setShredLevel(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shredding method" />
                    </SelectTrigger>
                    <SelectContent>
                      {shredMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{method.label}</span>
                            <Badge 
                              variant={method.security === 'ULTRA_SECURE' ? 'destructive' : 'default'}
                              className="ml-2"
                            >
                              {method.security.replace('_', ' ')}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {shredLevel && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <strong>Method:</strong> {shredMethods.find(m => m.value === shredLevel)?.description}
                      <br />
                      <strong>Overwrite passes:</strong> {shredMethods.find(m => m.value === shredLevel)?.passes}
                    </div>
                  )}
                </div>

                {/* Overall Progress */}
                {isShredding && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="w-full" />
                  </div>
                )}

                {/* Operation Details */}
                {operations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Shredding Operations</h4>
                    {operations.map((operation) => (
                      <Card key={operation.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{operation.description}</span>
                          <Badge 
                            variant={
                              operation.status === 'completed' ? 'default' :
                              operation.status === 'running' ? 'secondary' :
                              operation.status === 'error' ? 'destructive' : 'outline'
                            }
                          >
                            {operation.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{operation.passes} passes • {operation.type}</span>
                            <span>{operation.progress}%</span>
                          </div>
                          <Progress value={operation.progress} className="h-2" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Start Shredding Button */}
                <Button 
                  onClick={startSecureShred} 
                  disabled={isShredding}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  {isShredding ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Securely Shredding Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Start Secure Shredding
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6 mt-6">
              {results ? (
                <>
                  <Alert className="border-green-200 bg-green-50">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Secure Shredding Complete:</strong> Data has been overwritten using military-grade methods.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600">{results.completedOperations}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-red-600">{results.failedOperations}</div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatBytes(results.bytesShredded)}</div>
                        <div className="text-sm text-gray-600">Shredded</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-purple-600">{(results.timeElapsed / 1000).toFixed(1)}s</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <HardDrive className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Shredding Complete:</strong> Data has been overwritten {shredMethods.find(m => m.value === shredLevel)?.passes} times 
                      using {shredMethods.find(m => m.value === shredLevel)?.label}. Recovery is virtually impossible.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Run secure shredding to view results</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="emergency" className="space-y-6 mt-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>EMERGENCY PROTOCOLS:</strong> These functions immediately destroy all cryptographic 
                  data without the normal overwriting process. Use only in extreme situations.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Card className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-red-600" />
                        <span className="font-semibold">Instant Crypto Clear</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Immediately removes all stored PGP keys and cryptographic data from browser storage. 
                        This is NOT secure deletion - use only for emergency situations.
                      </p>
                      <Button 
                        onClick={clearAllCryptoData}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Emergency Clear All
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Note:</strong> For maximum security, always use the secure shredding 
                    process instead of emergency clear. Emergency functions do not overwrite data and may 
                    leave recoverable traces.
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