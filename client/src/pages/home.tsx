import { useState } from "react";
import { Shield, HelpCircle, Settings as SettingsIcon, Cog, Zap, Archive, Search, FileText, Activity, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import KeyGeneration from "@/components/pgp/key-generation";
import TextEncryption from "@/components/pgp/text-encryption";
import FileEncryption from "@/components/pgp/file-encryption";
import KeyManagement from "@/components/pgp/key-management";
import BatchProcessor from "@/components/pgp/batch-processor";
import MessageSigning from "@/components/pgp/message-signing";
import BackupRecovery from "@/components/pgp/backup-recovery";
import AdvancedSearch from "@/components/pgp/advanced-search";
import MessageTemplates from "@/components/pgp/message-templates";
import SecurityAudit from "@/components/pgp/security-audit";
import KeyExpiration from "@/components/pgp/key-expiration";

export default function Home() {
  const [activeTab, setActiveTab] = useState("generate");

  const tabs = [
    // Core Features
    { id: "generate", label: "Generate Keys", icon: <Shield className="mr-2 h-4 w-4" />, component: <KeyGeneration /> },
    { id: "text", label: "Text Encryption", icon: <span className="mr-2 text-lg">📝</span>, component: <TextEncryption /> },
    { id: "files", label: "File Encryption", icon: <span className="mr-2 text-lg">📄</span>, component: <FileEncryption /> },
    { id: "keys", label: "Key Management", icon: <SettingsIcon className="mr-2 h-4 w-4" />, component: <KeyManagement /> },
    
    // Advanced Features
    { id: "batch", label: "Batch Processing", icon: <Zap className="mr-2 h-4 w-4" />, component: <BatchProcessor /> },
    { id: "signing", label: "Message Signing", icon: <span className="mr-2 text-lg">✍️</span>, component: <MessageSigning /> },
    { id: "backup", label: "Backup & Recovery", icon: <Archive className="mr-2 h-4 w-4" />, component: <BackupRecovery /> },
    { id: "search", label: "Advanced Search", icon: <Search className="mr-2 h-4 w-4" />, component: <AdvancedSearch /> },
    { id: "templates", label: "Message Templates", icon: <FileText className="mr-2 h-4 w-4" />, component: <MessageTemplates /> },
    { id: "audit", label: "Security Audit", icon: <Activity className="mr-2 h-4 w-4" />, component: <SecurityAudit /> },
    { id: "expiration", label: "Key Expiration", icon: <Calendar className="mr-2 h-4 w-4" />, component: <KeyExpiration /> }
  ];

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
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" title="Help & Documentation">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" title="Settings">
                <Cog className="h-5 w-5" />
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

        {/* Custom Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center py-4 px-6 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="relative">
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            Made with <span className="text-red-500">♥</span> by{" "}
            <a 
              href="https://jason-clark.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Jason Clark
            </a>
            !
          </div>
        </div>
      </footer>
    </div>
  );
}
