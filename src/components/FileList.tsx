import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { File, Share2, Lock, Unlock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';

interface FileRecord {
  publicKey: string;
  account: {
    fileName: string;
    fileSize: number;
    primaryStorage: string;
    status: any;
    isPublic: boolean;
    createdAt: number;
  };
}

export const FileList = ({ refresh }: { refresh?: number }) => {
  const { publicKey } = useWallet();
  const { getUserFiles } = useSoldriveProgram();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      if (!publicKey) {
        setFiles([]);
        setLoading(false);
        return;
      }

      try {
        const userFiles = await getUserFiles();
        setFiles(userFiles as any);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [publicKey, getUserFiles, refresh]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusColor = (status: any) => {
    const statusKey = Object.keys(status)[0];
    switch (statusKey) {
      case 'active': return 'bg-secondary/20 text-secondary';
      case 'processing': return 'bg-primary/20 text-primary';
      case 'uploading': return 'bg-muted-foreground/20 text-muted-foreground';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  if (!publicKey) {
    return (
      <Card className="glass card-shadow p-8 text-center">
        <p className="text-muted-foreground">Connect your wallet to view your files</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass card-shadow p-8 text-center">
        <p className="text-muted-foreground">Loading files...</p>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="glass card-shadow p-8 text-center">
        <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No files uploaded yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.publicKey} className="glass card-shadow p-6 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <File className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold mb-1 truncate">{file.account.fileName}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatFileSize(file.account.fileSize)}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(file.account.status)}>
                    {Object.keys(file.account.status)[0]}
                  </Badge>
                  
                  {file.account.isPublic ? (
                    <Badge variant="outline" className="gap-1">
                      <Unlock className="w-3 h-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {file.account.primaryStorage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://gateway.lighthouse.storage/ipfs/${file.account.primaryStorage}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
