import { useState } from "react";
import { Lock, Unlock, Copy, Download, Users, Clipboard, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePGP } from "@/hooks/use-pgp";
import { PGPStorage } from "@/lib/storage";

export default function TextEncryption() {
  const [encryptData, setEncryptData] = useState({
    recipientKey: "",
    message: ""
  });
  const [decryptData, setDecryptData] = useState({
    privateKey: "",
    passphrase: "",
    encryptedMessage: ""
  });
  const [encryptedResult, setEncryptedResult] = useState("");
  const [decryptedResult, setDecryptedResult] = useState("");

  const { 
    encryptText, 
    decryptText, 
    isEncrypting, 
    isDecrypting, 
    downloadFile 
  } = usePGP();

  const handleEncrypt = async () => {
    if (!encryptData.recipientKey.trim() || !encryptData.message.trim()) {
      return;
    }

    const result = await encryptText(encryptData.message, encryptData.recipientKey);
    if (result.success) {
      setEncryptedResult(result.encryptedData);
    }
  };

  const handleDecrypt = async () => {
    if (!decryptData.privateKey.trim() || !decryptData.encryptedMessage.trim()) {
      return;
    }

    const result = await decryptText(
      decryptData.encryptedMessage, 
      decryptData.privateKey, 
      decryptData.passphrase || undefined
    );
    if (result.success) {
      setDecryptedResult(result.decryptedData);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadEncrypted = () => {
    if (encryptedResult) {
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(encryptedResult, `encrypted_message_${timestamp}.asc`);
    }
  };

  const loadSavedKeys = () => {
    const keyPairs = PGPStorage.getKeyPairs();
    if (keyPairs.length > 0) {
      setDecryptData(prev => ({ ...prev, privateKey: keyPairs[0].privateKey }));
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('-----BEGIN PGP MESSAGE-----')) {
        setDecryptData(prev => ({ ...prev, encryptedMessage: text }));
      } else if (text.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
        setEncryptData(prev => ({ ...prev, recipientKey: text }));
      }
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Encryption Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="text-primary mr-3" />
              Encrypt Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipientKey">Recipient's Public Key</Label>
              <Textarea
                id="recipientKey"
                value={encryptData.recipientKey}
                onChange={(e) => setEncryptData(prev => ({ ...prev, recipientKey: e.target.value }))}
                className="h-24 text-xs font-mono"
                placeholder="Paste the recipient's public key here..."
              />
            </div>

            <div>
              <Label htmlFor="plaintextMessage">Message to Encrypt</Label>
              <Textarea
                id="plaintextMessage"
                value={encryptData.message}
                onChange={(e) => setEncryptData(prev => ({ ...prev, message: e.target.value }))}
                className="h-40 resize-none"
                placeholder="Type your message here..."
              />
              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                <span>This message will be encrypted and can only be read by the recipient</span>
                <span>{encryptData.message.length} characters</span>
              </div>
            </div>

            <Button 
              onClick={handleEncrypt} 
              className="w-full" 
              disabled={isEncrypting || !encryptData.recipientKey.trim() || !encryptData.message.trim()}
            >
              <Lock className="mr-2 h-4 w-4" />
              {isEncrypting ? "Encrypting..." : "Encrypt Message"}
            </Button>

            {encryptedResult && (
              <div className="mt-6">
                <Label>Encrypted Message</Label>
                <Textarea
                  value={encryptedResult}
                  readOnly
                  className="h-32 text-xs font-mono bg-gray-50"
                  placeholder="Encrypted message will appear here..."
                />
                <div className="mt-2 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyToClipboard(encryptedResult)}
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadEncrypted}
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decryption Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Unlock className="text-green-600 mr-3" />
              Decrypt Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="privateKeyDecrypt">Your Private Key</Label>
              <Textarea
                id="privateKeyDecrypt"
                value={decryptData.privateKey}
                onChange={(e) => setDecryptData(prev => ({ ...prev, privateKey: e.target.value }))}
                className="h-24 text-xs font-mono"
                placeholder="Paste your private key here..."
              />
            </div>

            <div>
              <Label htmlFor="privateKeyPassphrase">Private Key Passphrase</Label>
              <Input
                id="privateKeyPassphrase"
                type="password"
                value={decryptData.passphrase}
                onChange={(e) => setDecryptData(prev => ({ ...prev, passphrase: e.target.value }))}
                placeholder="Enter your passphrase"
              />
            </div>

            <div>
              <Label htmlFor="encryptedMessage">Encrypted Message</Label>
              <Textarea
                id="encryptedMessage"
                value={decryptData.encryptedMessage}
                onChange={(e) => setDecryptData(prev => ({ ...prev, encryptedMessage: e.target.value }))}
                className="h-32 text-xs font-mono"
                placeholder="Paste the encrypted message here..."
              />
            </div>

            <Button 
              onClick={handleDecrypt} 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={isDecrypting || !decryptData.privateKey.trim() || !decryptData.encryptedMessage.trim()}
            >
              <Unlock className="mr-2 h-4 w-4" />
              {isDecrypting ? "Decrypting..." : "Decrypt Message"}
            </Button>

            {decryptedResult && (
              <div className="mt-6">
                <Label>Decrypted Message</Label>
                <Textarea
                  value={decryptedResult}
                  readOnly
                  className="h-32 bg-green-50"
                  placeholder="Decrypted message will appear here..."
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleCopyToClipboard(decryptedResult)}
                >
                  <Copy className="mr-1 h-4 w-4" />
                  Copy Message
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-start text-left"
              onClick={loadSavedKeys}
            >
              <Users className="text-blue-500 text-xl mb-2" />
              <h4 className="font-medium text-gray-900">Load Saved Keys</h4>
              <p className="text-sm text-gray-600">Use keys saved in your browser</p>
            </Button>
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-start text-left"
              onClick={pasteFromClipboard}
            >
              <Clipboard className="text-green-500 text-xl mb-2" />
              <h4 className="font-medium text-gray-900">Paste from Clipboard</h4>
              <p className="text-sm text-gray-600">Automatically detect and paste keys</p>
            </Button>
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-start text-left"
              disabled
            >
              <History className="text-orange-500 text-xl mb-2" />
              <h4 className="font-medium text-gray-900">Recent Messages</h4>
              <p className="text-sm text-gray-600">Access recently encrypted messages</p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
