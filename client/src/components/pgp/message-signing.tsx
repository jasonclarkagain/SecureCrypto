import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { PGPStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface SignatureResult {
  valid: boolean;
  signerName?: string;
  signerEmail?: string;
  keyId?: string;
  timestamp?: Date;
  error?: string;
}

export default function MessageSigning() {
  const [activeTab, setActiveTab] = useState('sign');
  
  // Signing state
  const [messageToSign, setMessageToSign] = useState('');
  const [selectedSigningKey, setSelectedSigningKey] = useState('');
  const [signedMessage, setSignedMessage] = useState('');
  const [isSigningDetached, setIsSigningDetached] = useState(false);
  
  // Verification state
  const [messageToVerify, setMessageToVerify] = useState('');
  const [detachedSignature, setDetachedSignature] = useState('');
  const [verificationResult, setVerificationResult] = useState<SignatureResult | null>(null);
  
  const { toast } = useToast();
  
  const keyPairs = PGPStorage.getKeyPairs();
  const contactKeys = PGPStorage.getContactKeys();

  const signMessage = async () => {
    if (!messageToSign.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to sign.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSigningKey) {
      toast({
        title: "Error", 
        description: "Please select a signing key.",
        variant: "destructive"
      });
      return;
    }

    const keyPair = keyPairs.find(k => k.id === selectedSigningKey);
    if (!keyPair) {
      toast({
        title: "Error",
        description: "Selected key pair not found.",
        variant: "destructive"
      });
      return;
    }

    const passphrase = prompt(`Enter passphrase for key: ${keyPair.keyInfo.name}`);
    if (!passphrase) return;

    try {
      // Load OpenPGP
      const openpgp = (window as any).openpgp;
      if (!openpgp) {
        throw new Error('OpenPGP library not loaded');
      }

      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: keyPair.privateKey }),
        passphrase
      });

      if (isSigningDetached) {
        // Create detached signature
        const signature = await openpgp.sign({
          message: await openpgp.createMessage({ text: messageToSign }),
          signingKeys: privateKey,
          detached: true
        });
        setSignedMessage(signature);
      } else {
        // Create signed message
        const signedMsg = await openpgp.sign({
          message: await openpgp.createMessage({ text: messageToSign }),
          signingKeys: privateKey
        });
        setSignedMessage(signedMsg);
      }

      toast({
        title: "Success",
        description: "Message signed successfully.",
      });
    } catch (error) {
      toast({
        title: "Signing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const verifyMessage = async () => {
    if (!messageToVerify.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to verify.",
        variant: "destructive"
      });
      return;
    }

    try {
      const openpgp = (window as any).openpgp;
      if (!openpgp) {
        throw new Error('OpenPGP library not loaded');
      }

      let message;
      let signature;

      if (detachedSignature.trim()) {
        // Verify detached signature
        message = await openpgp.createMessage({ text: messageToVerify });
        signature = await openpgp.readSignature({ armoredSignature: detachedSignature });
      } else {
        // Verify signed message
        message = await openpgp.readMessage({ armoredMessage: messageToVerify });
      }

      // Get all available public keys for verification
      const allPublicKeys = [
        ...keyPairs.map(k => k.publicKey),
        ...contactKeys.map(k => k.publicKey)
      ];

      const publicKeys = await Promise.all(
        allPublicKeys.map(key => openpgp.readKey({ armoredKey: key }))
      );

      const verificationResult = await openpgp.verify({
        message,
        signature: detachedSignature.trim() ? signature : undefined,
        verificationKeys: publicKeys
      });

      const { signatures } = verificationResult;
      if (signatures.length > 0) {
        const sig = signatures[0];
        
        try {
          await sig.verified;
          
          // Find the signer's information
          const signerKeyId = sig.keyID.toHex().toUpperCase();
          let signerInfo = keyPairs.find(k => k.keyInfo.keyId === signerKeyId);
          if (!signerInfo) {
            signerInfo = contactKeys.find(k => k.keyId === signerKeyId);
          }

          setVerificationResult({
            valid: true,
            signerName: signerInfo ? ('keyInfo' in signerInfo ? signerInfo.keyInfo.name : signerInfo.name) : 'Unknown',
            signerEmail: signerInfo ? ('keyInfo' in signerInfo ? signerInfo.keyInfo.email : signerInfo.email) : 'Unknown',
            keyId: signerKeyId,
            timestamp: new Date()
          });

          toast({
            title: "Signature Valid",
            description: `Message authenticated by ${signerInfo ? ('keyInfo' in signerInfo ? signerInfo.keyInfo.name : signerInfo.name) : 'unknown signer'}`,
          });
        } catch (error) {
          setVerificationResult({
            valid: false,
            error: 'Invalid signature'
          });
        }
      } else {
        setVerificationResult({
          valid: false,
          error: 'No signatures found'
        });
      }
    } catch (error) {
      setVerificationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
      
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard.",
    });
  };

  const downloadSignature = () => {
    const blob = new Blob([signedMessage], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isSigningDetached ? 'signature.sig' : 'signed-message.asc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">✍️</span>
            <span>Message Signing & Verification</span>
          </CardTitle>
          <CardDescription>
            Sign messages to prove authenticity and verify signatures from others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign">Sign Message</TabsTrigger>
              <TabsTrigger value="verify">Verify Signature</TabsTrigger>
            </TabsList>

            <TabsContent value="sign" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Private Key</label>
                  <Select value={selectedSigningKey} onValueChange={setSelectedSigningKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your key for signing..." />
                    </SelectTrigger>
                    <SelectContent>
                      {keyPairs.map((keyPair) => (
                        <SelectItem key={keyPair.id} value={keyPair.id}>
                          {keyPair.keyInfo.name} - {keyPair.keyInfo.keyId.substring(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message to Sign</label>
                  <Textarea
                    placeholder="Enter the message you want to sign..."
                    value={messageToSign}
                    onChange={(e) => setMessageToSign(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button onClick={signMessage} disabled={!messageToSign.trim() || !selectedSigningKey}>
                    Sign Message
                  </Button>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isSigningDetached}
                      onChange={(e) => setIsSigningDetached(e.target.checked)}
                    />
                    <span>Create detached signature</span>
                  </label>
                </div>

                {signedMessage && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {isSigningDetached ? 'Detached Signature' : 'Signed Message'}
                      </label>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(signedMessage)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadSignature}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={signedMessage}
                      readOnly
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                <Alert>
                  <AlertDescription>
                    <strong>Digital Signatures:</strong> Signing proves the message came from you and hasn't been modified. 
                    Detached signatures keep the original message separate from the signature.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="verify" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message to Verify</label>
                  <Textarea
                    placeholder="Paste the signed message or original message here..."
                    value={messageToVerify}
                    onChange={(e) => setMessageToVerify(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Detached Signature (optional)</label>
                  <Textarea
                    placeholder="If you have a detached signature, paste it here..."
                    value={detachedSignature}
                    onChange={(e) => setDetachedSignature(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty if the message already contains the signature
                  </p>
                </div>

                <Button onClick={verifyMessage} disabled={!messageToVerify.trim()}>
                  Verify Signature
                </Button>

                {verificationResult && (
                  <Card className={`${verificationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        {verificationResult.valid ? (
                          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={verificationResult.valid ? "success" : "destructive"}>
                              {verificationResult.valid ? "Valid Signature" : "Invalid Signature"}
                            </Badge>
                          </div>
                          {verificationResult.valid ? (
                            <div className="space-y-1 text-sm">
                              <p><strong>Signed by:</strong> {verificationResult.signerName}</p>
                              <p><strong>Email:</strong> {verificationResult.signerEmail}</p>
                              <p><strong>Key ID:</strong> {verificationResult.keyId}</p>
                              <p><strong>Verified at:</strong> {verificationResult.timestamp?.toLocaleString()}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-700">
                              {verificationResult.error || 'The signature could not be verified.'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Verification requires the signer's public key.</strong> Make sure you have imported the public key 
                    of the person who signed the message in your key management section.
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