import { useState } from "react";
import { Key, Download, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePGP } from "@/hooks/use-pgp";
import { PGPKeyPair } from "@/lib/pgp";

export default function KeyGeneration() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    passphrase: "",
    keySize: "4096"
  });
  const [generatedKeys, setGeneratedKeys] = useState<PGPKeyPair | null>(null);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [nickname, setNickname] = useState("");

  const { 
    generateKeyPair, 
    isGenerating, 
    progress, 
    saveKeyPair, 
    downloadFile 
  } = usePGP();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keyPair = await generateKeyPair(
      formData.name,
      formData.email,
      formData.passphrase || undefined,
      parseInt(formData.keySize)
    );

    if (keyPair) {
      setGeneratedKeys(keyPair);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadKeys = () => {
    if (!generatedKeys) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `${formData.name.replace(/\s+/g, '_')}_${timestamp}`;

    downloadFile(generatedKeys.publicKey, `${baseName}_public.asc`);
    downloadFile(generatedKeys.privateKey, `${baseName}_private.asc`);
  };

  const handleSaveKeys = () => {
    if (!generatedKeys) return;
    saveKeyPair(generatedKeys, nickname || undefined);
  };

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Key Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="text-primary mr-3" />
              Generate New PGP Key Pair
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">This will be associated with your key pair</p>
              </div>

              <div>
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Your primary identifier for this key</p>
              </div>

              <div>
                <Label htmlFor="passphrase">Passphrase (Optional but Recommended)</Label>
                <div className="relative">
                  <Input
                    id="passphrase"
                    type={showPassphrase ? "text" : "password"}
                    value={formData.passphrase}
                    onChange={(e) => setFormData(prev => ({ ...prev, passphrase: e.target.value }))}
                    placeholder="Enter a strong passphrase"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                  >
                    {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Protects your private key if compromised</p>
              </div>

              <div>
                <Label htmlFor="keySize">Key Size</Label>
                <Select value={formData.keySize} onValueChange={(value) => setFormData(prev => ({ ...prev, keySize: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2048">2048 bits (Standard)</SelectItem>
                    <SelectItem value="4096">4096 bits (Recommended)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-500">Higher values are more secure but slower</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:bg-gray-400 disabled:cursor-not-allowed" 
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-5 w-5" />
                    🔑 Generate Key Pair
                  </>
                )}
              </Button>
            </form>

            {/* Loading State */}
            {isGenerating && (
              <div className="mt-6 text-center">
                <Progress value={progress} className="mb-4" />
                <p className="text-gray-600">Generating your PGP key pair...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="text-green-600 mr-3" />
              Your Generated Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedKeys ? (
              <div className="space-y-4">
                <div>
                  <Label>Public Key</Label>
                  <Textarea
                    value={generatedKeys.publicKey}
                    readOnly
                    className="h-32 text-xs font-mono bg-gray-50"
                    placeholder="Your public key will appear here..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleCopyToClipboard(generatedKeys.publicKey)}
                  >
                    📋 Copy Public Key
                  </Button>
                </div>

                <div>
                  <Label>Private Key</Label>
                  <Textarea
                    value={generatedKeys.privateKey}
                    readOnly
                    className="h-32 text-xs font-mono bg-gray-50"
                    placeholder="Your private key will appear here..."
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleCopyToClipboard(generatedKeys.privateKey)}
                  >
                    📋 Copy Private Key
                  </Button>
                </div>

                <div>
                  <Label htmlFor="nickname">Nickname (Optional)</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="My personal key"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={handleDownloadKeys} 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    💾 Download Keys
                  </Button>
                  <Button 
                    onClick={handleSaveKeys} 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    🗄️ Save to Browser
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Key className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Generate a key pair to see your keys here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-blue-500 mr-3">ℹ️</span>
            How to Generate PGP Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Enter Your Details</h4>
              <p className="text-sm text-gray-600">Provide your name and email address for key identification</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Set Passphrase</h4>
              <p className="text-sm text-gray-600">Choose a strong passphrase to protect your private key</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download & Save</h4>
              <p className="text-sm text-gray-600">Securely store your keys for future use</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
