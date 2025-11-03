import { useState } from 'react';
import { Database, Upload, Files } from 'lucide-react';
import { WalletButton } from '@/components/WalletButton';
import { UserProfile } from '@/components/UserProfile';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SharedFiles from '@/components/SharedFiles';

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SolDrive
                </h1>
                <p className="text-xs text-muted-foreground">Decentralized Storage</p>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Your Files on Solana
          </h2>
          <p className="text-muted-foreground">
            Store files on IPFS, secured by blockchain
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <UserProfile />
          </div>
          <div className="lg:col-span-2">
            <FileUpload onUploadComplete={() => setRefreshKey(prev => prev + 1)} />
          </div>
        </div>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="glass mb-6">
            <TabsTrigger value="files" className="gap-2">
              <Files className="w-4 h-4" />
              My Files
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2">
              <Upload className="w-4 h-4" />
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            <FileList refresh={refreshKey} />
          </TabsContent>

          <TabsContent value="shared">
            <SharedFiles />
          </TabsContent>

        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Built on Solana • Powered by Lighthouse IPFS</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
