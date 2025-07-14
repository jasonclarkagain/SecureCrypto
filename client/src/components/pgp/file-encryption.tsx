import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Lock, Unlock, Upload, Download, Shield, Check, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePGP } from "@/hooks/use-pgp";

interface FileItem {
  file: File;
  id: string;
  status: 'pending' | 'encrypting' | 'encrypted' | 'error';
  result?: string;
  error?: string;
}

export default function FileEncryption() {
  const [encryptFiles, setEncryptFiles] = useState<FileItem[]>([]);
  const [decryptFiles, setDecryptFiles] = useState<FileItem[]>([]);
  const [encryptKey, setEncryptKey] = useState("");
  const [decryptKey, setDecryptKey] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const { encryptFile, decryptFile, isEncrypting, isDecrypting, progress, downloadFile, downloadBinaryFile } = usePGP();

  // File size limit: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const onEncryptDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileItem[] = acceptedFiles
      .filter(file => file.size <= MAX_FILE_SIZE)
      .map(file => ({
        file,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        status: 'pending' as const
      }));

    setEncryptFiles(prev => [...prev, ...newFiles]);
  }, []);

  const onDecryptDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileItem[] = acceptedFiles.map(file => ({
      file,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'pending' as const
    }));

    setDecryptFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps: getEncryptRootProps, getInputProps: getEncryptInputProps, isDragActive: isEncryptDragActive } = useDropzone({
    onDrop: onEncryptDrop,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const { getRootProps: getDecryptRootProps, getInputProps: getDecryptInputProps, isDragActive: isDecryptDragActive } = useDropzone({
    onDrop: onDecryptDrop,
    multiple: true
  });

  const handleEncryptFiles = async () => {
    if (!encryptKey.trim() || encryptFiles.length === 0) return;

    for (const fileItem of encryptFiles) {
      if (fileItem.status !== 'pending') continue;

      setEncryptFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'encrypting' } : f
      ));

      const result = await encryptFile(fileItem.file, encryptKey);

      setEncryptFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: result.success ? 'encrypted' : 'error',
              result: result.success ? result.encryptedData : undefined,
              error: result.success ? undefined : result.error
            } 
          : f
      ));
    }
  };

  const handleDecryptFiles = async () => {
    if (!decryptKey.trim() || decryptFiles.length === 0) return;

    for (const fileItem of decryptFiles) {
      if (fileItem.status !== 'pending') continue;

      setDecryptFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'encrypting' } : f
      ));

      // Read file content as text
      const fileContent = await fileItem.file.text();
      const result = await decryptFile(fileContent, decryptKey, passphrase || undefined);

      setDecryptFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { 
              ...f, 
              status: result.success ? 'encrypted' : 'error',
              error: result.success ? undefined : result.error
            } 
          : f
      ));

      if (result.success) {
        downloadBinaryFile(result.data, result.filename);
      }
    }
  };

  const removeEncryptFile = (id: string) => {
    setEncryptFiles(prev => prev.filter(f => f.id !== id));
  };

  const removeDecryptFile = (id: string) => {
    setDecryptFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadEncryptedFile = (fileItem: FileItem) => {
    if (fileItem.result) {
      downloadFile(fileItem.result, `${fileItem.file.name}.asc`, 'text/plain');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-gray-400" />;
      case 'encrypting':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      case 'encrypted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* File Encryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="text-primary mr-3" />
              Encrypt Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              {...getEncryptRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isEncryptDragActive 
                  ? 'border-primary bg-blue-50' 
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              <input {...getEncryptInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drop files here to encrypt</p>
              <p className="text-sm text-gray-600 mb-4">or click to browse</p>
              <Button variant="outline">Choose Files</Button>
            </div>

            <div>
              <Label htmlFor="fileRecipientKey">Recipient's Public Key</Label>
              <Textarea
                id="fileRecipientKey"
                value={encryptKey}
                onChange={(e) => setEncryptKey(e.target.value)}
                className="h-20 text-xs font-mono"
                placeholder="Paste the recipient's public key here..."
              />
            </div>

            {/* File List */}
            {encryptFiles.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Files to Encrypt</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {encryptFiles.map((fileItem) => (
                    <div key={fileItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(fileItem.status)}
                        <div>
                          <p className="text-sm font-medium">{fileItem.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                          {fileItem.error && (
                            <p className="text-xs text-red-500">{fileItem.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {fileItem.status === 'encrypted' && fileItem.result && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadEncryptedFile(fileItem)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEncryptFile(fileItem.id)}
                          disabled={fileItem.status === 'encrypting'}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleEncryptFiles} 
                  className="mt-4 w-full" 
                  disabled={isEncrypting || !encryptKey.trim()}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isEncrypting ? "Encrypting..." : "Encrypt All Files"}
                </Button>
                {isEncrypting && (
                  <Progress value={progress} className="mt-2" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Decryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Unlock className="text-green-600 mr-3" />
              Decrypt Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Area */}
            <div
              {...getDecryptRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDecryptDragActive 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              <input {...getDecryptInputProps()} />
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drop encrypted files here</p>
              <p className="text-sm text-gray-600 mb-4">or click to browse</p>
              <Button variant="outline">Choose Files</Button>
            </div>

            <div>
              <Label htmlFor="filePrivateKey">Your Private Key</Label>
              <Textarea
                id="filePrivateKey"
                value={decryptKey}
                onChange={(e) => setDecryptKey(e.target.value)}
                className="h-20 text-xs font-mono"
                placeholder="Paste your private key here..."
              />
            </div>

            <div>
              <Label htmlFor="filePassphrase">Private Key Passphrase</Label>
              <Input
                id="filePassphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your passphrase"
              />
            </div>

            {/* File List */}
            {decryptFiles.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Files to Decrypt</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {decryptFiles.map((fileItem) => (
                    <div key={fileItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(fileItem.status)}
                        <div>
                          <p className="text-sm font-medium">{fileItem.file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                          {fileItem.error && (
                            <p className="text-xs text-red-500">{fileItem.error}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDecryptFile(fileItem.id)}
                        disabled={fileItem.status === 'encrypting'}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleDecryptFiles} 
                  className="mt-4 w-full bg-green-600 hover:bg-green-700" 
                  disabled={isDecrypting || !decryptKey.trim()}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  {isDecrypting ? "Decrypting..." : "Decrypt All Files"}
                </Button>
                {isDecrypting && (
                  <Progress value={progress} className="mt-2" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Encryption Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-blue-500 mr-3">ℹ️</span>
            File Encryption Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supported File Types</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><Check className="inline h-4 w-4 text-green-500 mr-2" />Documents (PDF, DOC, TXT)</li>
                <li><Check className="inline h-4 w-4 text-green-500 mr-2" />Images (JPG, PNG, GIF)</li>
                <li><Check className="inline h-4 w-4 text-green-500 mr-2" />Archives (ZIP, RAR)</li>
                <li><Check className="inline h-4 w-4 text-green-500 mr-2" />Any file type up to 10MB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><Shield className="inline h-4 w-4 text-blue-500 mr-2" />Client-side encryption only</li>
                <li><Shield className="inline h-4 w-4 text-blue-500 mr-2" />Original files remain unchanged</li>
                <li><Shield className="inline h-4 w-4 text-blue-500 mr-2" />Automatic secure deletion</li>
                <li><Shield className="inline h-4 w-4 text-blue-500 mr-2" />Progress tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
