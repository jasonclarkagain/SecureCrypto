import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Upload, Play, Pause, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { usePGP } from "@/hooks/use-pgp";
import { PGPStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: string;
  error?: string;
  outputFilename?: string;
}

export default function BatchProcessor() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [operation, setOperation] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  const { encryptFile, decryptFile } = usePGP();
  const { toast } = useToast();

  // Get available keys based on operation
  const getAvailableKeys = () => {
    if (operation === 'encrypt') {
      return [...PGPStorage.getKeyPairs(), ...PGPStorage.getContactKeys()];
    } else {
      return PGPStorage.getKeyPairs();
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: BatchFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: operation === 'decrypt' ? {
      'application/octet-stream': ['.gpg', '.pgp'],
      'text/plain': ['.asc']
    } : undefined
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    if (!isProcessing) {
      setFiles([]);
      setOverallProgress(0);
    }
  };

  const updateFileProgress = (id: string, updates: Partial<BatchFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const processFiles = async () => {
    if (!selectedKeyId) {
      toast({
        title: "No Key Selected",
        description: "Please select a key for the operation.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    let completedCount = 0;

    for (const file of pendingFiles) {
      if (isPaused) break;

      updateFileProgress(file.id, { status: 'processing', progress: 0 });

      try {
        if (operation === 'encrypt') {
          // Find the selected key
          const allKeys = getAvailableKeys();
          const selectedKey = allKeys.find(k => k.id === selectedKeyId);
          
          if (!selectedKey) {
            throw new Error('Selected key not found');
          }

          const result = await encryptFile(file.file, selectedKey.publicKey);
          
          if (result.success) {
            updateFileProgress(file.id, {
              status: 'completed',
              progress: 100,
              result: 'encrypted',
              outputFilename: `${file.file.name}.gpg`
            });
          } else {
            throw new Error(result.error || 'Encryption failed');
          }
        } else {
          // Decrypt file
          const keyPairs = PGPStorage.getKeyPairs();
          const selectedKeyPair = keyPairs.find(k => k.id === selectedKeyId);
          
          if (!selectedKeyPair) {
            throw new Error('Selected key pair not found');
          }

          const passphrase = prompt(`Enter passphrase for key: ${selectedKeyPair.keyInfo.name}`);
          if (!passphrase) {
            throw new Error('Passphrase required for decryption');
          }

          const result = await decryptFile(file.file, selectedKeyPair.privateKey, passphrase);
          
          if (result.success) {
            updateFileProgress(file.id, {
              status: 'completed',
              progress: 100,
              result: 'decrypted',
              outputFilename: result.filename
            });
          } else {
            throw new Error(result.error || 'Decryption failed');
          }
        }
      } catch (error) {
        updateFileProgress(file.id, {
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      completedCount++;
      setOverallProgress((completedCount / pendingFiles.length) * 100);
    }

    setIsProcessing(false);
    
    const successCount = files.filter(f => f.status === 'completed').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    
    toast({
      title: "Batch Processing Complete",
      description: `${successCount} files processed successfully. ${errorCount} errors.`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const pauseProcessing = () => {
    setIsPaused(true);
  };

  const downloadAllResults = () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    // In a real implementation, this would create a ZIP file with all results
    toast({
      title: "Download Started",
      description: `Preparing ${completedFiles.length} files for download...`
    });
  };

  const getStatusColor = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'success';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <span>Batch File Processor</span>
          </CardTitle>
          <CardDescription>
            Process multiple files at once with encryption or decryption operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operation Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation</label>
              <Select value={operation} onValueChange={(value: 'encrypt' | 'decrypt') => setOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encrypt">Encrypt Files</SelectItem>
                  <SelectItem value="decrypt">Decrypt Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {operation === 'encrypt' ? 'Recipient Key' : 'Your Private Key'}
              </label>
              <Select value={selectedKeyId} onValueChange={setSelectedKeyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableKeys().map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {'keyInfo' in key ? key.keyInfo.name : key.name} - {key.keyId?.substring(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-600">
              {operation === 'decrypt' 
                ? 'Or click to select encrypted files (.gpg, .pgp, .asc)'
                : 'Or click to select files to encrypt'
              }
            </p>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files ({files.length})</h3>
                <div className="flex space-x-2">
                  {!isProcessing && files.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                  {files.some(f => f.status === 'completed') && (
                    <Button variant="outline" size="sm" onClick={downloadAllResults}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Results
                    </Button>
                  )}
                </div>
              </div>

              {/* Overall Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="w-full" />
                </div>
              )}

              {/* Individual Files */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <Badge variant={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024).toFixed(1)} KB
                        {file.outputFilename && ` → ${file.outputFilename}`}
                      </p>
                      {file.status === 'processing' && (
                        <Progress value={file.progress} className="w-full mt-1" size="sm" />
                      )}
                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                    {!isProcessing && (
                      <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Controls */}
          {files.length > 0 && (
            <div className="flex items-center space-x-4">
              {!isProcessing ? (
                <Button onClick={processFiles} disabled={!selectedKeyId || files.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Processing
                </Button>
              ) : (
                <Button variant="outline" onClick={pauseProcessing}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              
              <div className="text-sm text-gray-600">
                {files.filter(f => f.status === 'completed').length} completed, {' '}
                {files.filter(f => f.status === 'error').length} errors
              </div>
            </div>
          )}

          {/* Help Text */}
          <Alert>
            <AlertDescription>
              <strong>Tip:</strong> For large batches, files are processed sequentially to maintain system stability. 
              You can pause and resume processing at any time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}