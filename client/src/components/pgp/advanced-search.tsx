import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Download, Copy, Key, User, Mail, Calendar, Hash } from "lucide-react";
import { PGPStorage, type StoredKeyPair, type ContactKey } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

type SearchType = 'all' | 'keypairs' | 'contacts';
type SortBy = 'name' | 'email' | 'created' | 'keysize';
type SortOrder = 'asc' | 'desc';

interface SearchFilters {
  query: string;
  type: SearchType;
  keySize?: string;
  algorithm?: string;
  dateRange?: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface SearchResult {
  id: string;
  type: 'keypair' | 'contact';
  name: string;
  email: string;
  keyId: string;
  keySize?: number;
  algorithm?: string;
  created: Date;
  nickname?: string;
  publicKey: string;
  privateKey?: string;
}

export default function AdvancedSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Get all data and transform to unified format
  const getAllSearchableData = (): SearchResult[] => {
    const keyPairs = PGPStorage.getKeyPairs();
    const contacts = PGPStorage.getContactKeys();

    const keyPairResults: SearchResult[] = keyPairs.map(kp => ({
      id: kp.id,
      type: 'keypair' as const,
      name: kp.keyInfo.name,
      email: kp.keyInfo.email,
      keyId: kp.keyInfo.keyId,
      keySize: kp.keyInfo.keySize,
      algorithm: 'RSA', // Assuming RSA for now
      created: kp.keyInfo.created,
      nickname: kp.nickname,
      publicKey: kp.publicKey,
      privateKey: kp.privateKey
    }));

    const contactResults: SearchResult[] = contacts.map(contact => ({
      id: contact.id,
      type: 'contact' as const,
      name: contact.name,
      email: contact.email,
      keyId: contact.keyId,
      created: contact.created,
      nickname: contact.nickname,
      publicKey: contact.publicKey
    }));

    return [...keyPairResults, ...contactResults];
  };

  // Filter and search results
  const filteredResults = useMemo(() => {
    let results = getAllSearchableData();

    // Filter by type
    if (filters.type !== 'all') {
      results = results.filter(r => 
        filters.type === 'keypairs' ? r.type === 'keypair' : r.type === 'contact'
      );
    }

    // Text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      results = results.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.keyId.toLowerCase().includes(query) ||
        (r.nickname && r.nickname.toLowerCase().includes(query))
      );
    }

    // Filter by key size
    if (filters.keySize && filters.keySize !== 'all') {
      const size = parseInt(filters.keySize);
      results = results.filter(r => r.keySize === size);
    }

    // Filter by algorithm
    if (filters.algorithm && filters.algorithm !== 'all') {
      results = results.filter(r => r.algorithm === filters.algorithm);
    }

    // Filter by date range
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const days = parseInt(filters.dateRange);
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      results = results.filter(r => r.created >= cutoff);
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'created':
          comparison = a.created.getTime() - b.created.getTime();
          break;
        case 'keysize':
          comparison = (a.keySize || 0) - (b.keySize || 0);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return results;
  }, [filters]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setSelectedResults(new Set());
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedResults(newSelection);
  };

  const selectAll = () => {
    setSelectedResults(new Set(filteredResults.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedResults(new Set());
  };

  const exportSelected = () => {
    const selected = filteredResults.filter(r => selectedResults.has(r.id));
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalKeys: selected.length,
      keys: selected.map(result => ({
        name: result.name,
        email: result.email,
        keyId: result.keyId,
        type: result.type,
        algorithm: result.algorithm,
        keySize: result.keySize,
        created: result.created,
        publicKey: result.publicKey,
        ...(result.type === 'keypair' && { hasPrivateKey: !!result.privateKey })
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgp-keys-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${selected.length} keys to JSON file.`,
    });
  };

  const copySelectedKeys = () => {
    const selected = filteredResults.filter(r => selectedResults.has(r.id));
    const publicKeys = selected.map(r => r.publicKey).join('\n\n');
    
    navigator.clipboard.writeText(publicKeys);
    toast({
      title: "Copied to Clipboard",
      description: `Copied ${selected.length} public keys.`,
    });
  };

  const getResultIcon = (type: 'keypair' | 'contact') => {
    return type === 'keypair' ? <Key className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-6 w-6" />
            <span>Advanced Key Search</span>
          </CardTitle>
          <CardDescription>
            Search and filter through your keys and contacts with advanced criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, key ID, or nickname..."
                  value={filters.query}
                  onChange={(e) => updateFilter('query', e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Type</label>
                <Select value={filters.type} onValueChange={(value: SearchType) => updateFilter('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Keys</SelectItem>
                    <SelectItem value="keypairs">My Keys</SelectItem>
                    <SelectItem value="contacts">Contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Key Size</label>
                <Select value={filters.keySize || 'all'} onValueChange={(value) => updateFilter('keySize', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Size</SelectItem>
                    <SelectItem value="2048">2048 bit</SelectItem>
                    <SelectItem value="4096">4096 bit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Created</label>
                <Select value={filters.dateRange || 'all'} onValueChange={(value) => updateFilter('dateRange', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value: SortBy) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="keysize">Key Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Order</label>
                <Select value={filters.sortOrder} onValueChange={(value: SortOrder) => updateFilter('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium">
                Results ({filteredResults.length})
              </h3>
              {selectedResults.size > 0 && (
                <Badge variant="secondary">
                  {selectedResults.size} selected
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              {filteredResults.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  {selectedResults.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                      <Button variant="outline" size="sm" onClick={copySelectedKeys}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Keys
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportSelected}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No keys found matching your criteria</p>
              </div>
            ) : (
              filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedResults.has(result.id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSelection(result.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedResults.has(result.id)}
                    onChange={() => toggleSelection(result.id)}
                    className="w-4 h-4"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getResultIcon(result.type)}
                      <span className="font-medium text-gray-900">{result.name}</span>
                      <Badge variant={result.type === 'keypair' ? 'default' : 'secondary'}>
                        {result.type === 'keypair' ? 'My Key' : 'Contact'}
                      </Badge>
                      {result.nickname && (
                        <Badge variant="outline">{result.nickname}</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {result.email}
                      </div>
                      <div className="flex items-center">
                        <Hash className="h-3 w-3 mr-1" />
                        {result.keyId.substring(0, 8)}...
                      </div>
                      {result.keySize && (
                        <div className="flex items-center">
                          <Key className="h-3 w-3 mr-1" />
                          {result.keySize} bit {result.algorithm}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(result.created)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}