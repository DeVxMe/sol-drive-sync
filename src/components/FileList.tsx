import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { File, Share2, Lock, Unlock, ExternalLink, Download, Eye, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';
import { toast } from 'sonner';
import { FileViewer } from './FileViewer';

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
  const [viewerFile, setViewerFile] = useState<FileRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadFiles = async () => {
      if (!publicKey) {
        setFiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get files from blockchain only
        const blockchainFiles = await getUserFiles();
        if (isMounted) {
          setFiles(blockchainFiles);
        }
      } catch (error) {
        console.error('Error loading files:', error);
        if (isMounted) {
          setFiles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFiles();
    
    return () => {
      isMounted = false;
    };
  }, [publicKey, refresh]);

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

  const handleDownload = async (file: FileRecord) => {
    if (!file.account.primaryStorage) {
      toast.error('File not available', {
        description: 'Storage location not found',
      });
      return;
    }

    try {
      toast.info('Downloading file...', {
        description: 'Please wait while we fetch your file',
      });

      const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${file.account.primaryStorage}`;
      const response = await fetch(ipfsUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.account.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download complete!', {
        description: `${file.account.fileName} has been downloaded`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleShare = (file: FileRecord) => {
    if (!file.account.primaryStorage) {
      toast.error('Cannot share', {
        description: 'File storage location not found',
      });
      return;
    }

    const shareUrl = `https://gateway.lighthouse.storage/ipfs/${file.account.primaryStorage}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!', {
      description: 'Share link has been copied to clipboard',
    });
  };

  const togglePrivacy = async (file: FileRecord, newPrivacy: boolean) => {
    try {
      toast.info('Updating privacy...', {
        description: 'Processing blockchain transaction',
      });

      // TODO: Implement blockchain transaction to update file privacy
      // This would call a Solana program instruction to update the isPublic field
      
      // For now, show a detailed message about what would happen
      const message = newPrivacy 
        ? 'Making file public will allow anyone with the link to view it'
        : 'Making file private will restrict access to only you';
      
      toast.warning('Privacy update requires blockchain transaction', {
        description: message,
        duration: 5000,
      });

      // After blockchain transaction succeeds, update local state
      // setFiles(files.map(f => 
      //   f.publicKey === file.publicKey 
      //     ? { ...f, account: { ...f.account, isPublic: newPrivacy } } 
      //     : f
      // ));
    } catch (error) {
      console.error('Privacy toggle error:', error);
      toast.error('Failed to update privacy', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
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
    <>
      <div className="space-y-4">
        {files.map((file) => (
          <Card key={file.publicKey} className="glass card-shadow p-6 hover:border-primary/50 transition-all group">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <File className="w-7 h-7 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg mb-1 truncate">{file.account.fileName}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatFileSize(file.account.fileSize)} • {new Date(file.account.createdAt * 1000).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(file.account.status)}>
                      {Object.keys(file.account.status)[0]}
                    </Badge>
                    
                    {file.account.isPublic ? (
                      <Badge variant="outline" className="gap-1 bg-secondary/10 border-secondary/30">
                        <Unlock className="w-3 h-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 bg-muted/50">
                        <Lock className="w-3 h-3" />
                        Private
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    file.account.isPublic ? 'bg-secondary/20' : 'bg-muted'
                  }`}>
                    {file.account.isPublic ? (
                      <Unlock className="w-5 h-5 text-secondary" />
                    ) : (
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`privacy-${file.publicKey}`} className="text-sm font-medium cursor-pointer block mb-0.5">
                      {file.account.isPublic ? 'Public Access' : 'Private Access'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {file.account.isPublic ? 'Anyone with link can view' : 'Only you can access'}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`privacy-${file.publicKey}`}
                  checked={file.account.isPublic}
                  onCheckedChange={(checked) => togglePrivacy(file, checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {file.account.primaryStorage && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewerFile(file)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(file)}
                      className="w-full"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://gateway.lighthouse.storage/ipfs/${file.account.primaryStorage}`, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open External
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {viewerFile && (
        <FileViewer
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
          fileName={viewerFile.account.fileName}
          ipfsCid={viewerFile.account.primaryStorage}
          fileSize={viewerFile.account.fileSize}
        />
      )}
    </>
  );
};
