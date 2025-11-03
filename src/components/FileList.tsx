import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { File, Share2, Lock, Unlock, ExternalLink, Download, Eye, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const { getUserFiles, makePublic, makePrivate } = useSoldriveProgram();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerFile, setViewerFile] = useState<FileRecord | null>(null);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    file: FileRecord | null;
    newPrivacy: boolean;
  }>({ open: false, file: null, newPrivacy: false });

  const fetchFiles = async () => {
    if (!publicKey) {
      setFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const blockchainFiles = await getUserFiles();
      setFiles(blockchainFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
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

  const handlePrivacyToggle = (file: FileRecord, newPrivacy: boolean) => {
    if (processingFiles.has(file.publicKey)) {
      toast.error('Transaction in progress', {
        description: 'Please wait for the current transaction to complete',
      });
      return;
    }
    setConfirmDialog({ open: true, file, newPrivacy });
  };

  const executePrivacyToggle = async () => {
    const { file, newPrivacy } = confirmDialog;
    if (!file) return;

    setConfirmDialog({ open: false, file: null, newPrivacy: false });

    // Add to processing set to prevent duplicate submissions
    setProcessingFiles(prev => new Set(prev).add(file.publicKey));

    try {
      const fileName = file.account.fileName;
      
      toast.info('Updating privacy...', {
        description: 'Processing blockchain transaction',
      });

      let txSignature: string;
      
      if (newPrivacy) {
        txSignature = await makePublic(fileName);
      } else {
        txSignature = await makePrivate(fileName);
      }

      toast.success('Success!', {
        description: (
          <div className="space-y-1">
            <p>File is now {newPrivacy ? 'public' : 'private'}</p>
            <a 
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline block"
            >
              View transaction →
            </a>
          </div>
        ),
        duration: 5000,
      });

      setTimeout(() => {
        fetchFiles();
        setProcessingFiles(prev => {
          const next = new Set(prev);
          next.delete(file.publicKey);
          return next;
        });
      }, 1500);
      
    } catch (error: any) {
      console.error('Privacy toggle error:', error);
      
      // Remove from processing set on error
      setProcessingFiles(prev => {
        const next = new Set(prev);
        next.delete(file.publicKey);
        return next;
      });

      // Handle specific error cases
      if (error?.message?.includes('AlreadyProcessed')) {
        toast.error('Transaction Already Processed', {
          description: 'This transaction was already submitted. Refreshing file list...',
          duration: 3000,
        });
        setTimeout(() => fetchFiles(), 1000);
      } else {
        toast.error('Transaction Failed', {
          description: error?.message || 'Failed to update privacy setting',
          duration: 5000,
        });
      }
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
                  disabled={processingFiles.has(file.publicKey)}
                  onCheckedChange={(checked) => handlePrivacyToggle(file, checked)}
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

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, file: null, newPrivacy: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.newPrivacy ? 'Make File Public?' : 'Make File Private?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newPrivacy 
                ? 'Making this file public will allow anyone with the link to view it. This requires a blockchain transaction.'
                : 'Making this file private will restrict access to only you. This requires a blockchain transaction.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executePrivacyToggle}>
              Confirm & Sign Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
