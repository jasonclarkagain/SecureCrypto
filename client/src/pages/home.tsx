import { useState } from "react";
import { Shield, HelpCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import KeyGeneration from "@/components/pgp/key-generation";
import TextEncryption from "@/components/pgp/text-encryption";
import FileEncryption from "@/components/pgp/file-encryption";
import KeyManagement from "@/components/pgp/key-management";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-bold text-gray-900">PGP Crypter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Notice */}
        <Alert className="mb-8 border-l-4 border-l-blue-400 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-700">
            <strong>Security Notice:</strong> All encryption and decryption happens locally in your browser. 
            Your keys and data never leave your device.
          </AlertDescription>
        </Alert>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger 
                value="generate" 
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-6 rounded-none bg-transparent"
              >
                <Shield className="mr-2 h-4 w-4" />
                Generate Keys
              </TabsTrigger>
              <TabsTrigger 
                value="text"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-6 rounded-none bg-transparent"
              >
                <span className="mr-2">Aa</span>
                Text Encryption
              </TabsTrigger>
              <TabsTrigger 
                value="files"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-6 rounded-none bg-transparent"
              >
                <span className="mr-2">📄</span>
                File Encryption
              </TabsTrigger>
              <TabsTrigger 
                value="keys"
                className="border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-6 rounded-none bg-transparent"
              >
                <Settings className="mr-2 h-4 w-4" />
                Key Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-0">
              <KeyGeneration />
            </TabsContent>

            <TabsContent value="text" className="mt-0">
              <TextEncryption />
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              <FileEncryption />
            </TabsContent>

            <TabsContent value="keys" className="mt-0">
              <KeyManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
