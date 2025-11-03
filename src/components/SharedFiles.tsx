import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { File, ExternalLink, Share2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';

interface SharedEntry {
  sharedAccess: any;
  file: null | { publicKey: string; account: any };
}

const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

export const SharedFiles = () => {
  const { publicKey } = useWallet();
  const { getFilesSharedWithMe, getFilesIShared, revokeAccess } = useSoldriveProgram();

  const [loading, setLoading] = useState(true);
  const [withMe, setWithMe] = useState<SharedEntry[]>([]);
  const [iShared, setIShared] = useState<SharedEntry[]>([]);
  const [revokingKeys, setRevokingKeys] = useState<Set<string>>(new Set());

  const refresh = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        getFilesSharedWithMe(),
        getFilesIShared(),
      ]);
      setWithMe(a);
      setIShared(b);
    } catch (e) {
      console.error('Error loading shared files:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey?.toBase58()]);

  const handleCopyLink = (cid?: string) => {
    if (!cid) return;
    const shareUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied!', { description: 'Share link has been copied to clipboard' });
  };

  const handleOpenExternal = (cid?: string) => {
    if (!cid) return;
    window.open(`https://gateway.lighthouse.storage/ipfs/${cid}`, '_blank');
  };

  const handleRevoke = async (entry: SharedEntry) => {
    if (!entry.file) {
      toast.error('Cannot revoke', { description: 'Missing file metadata' });
      return;
    }
    const fileName: string = entry.file.account.fileName;
    const sharedWith: string = entry.sharedAccess.account.sharedWith.toBase58?.() || entry.sharedAccess.account.sharedWith;

    const key = `${fileName}-${sharedWith}`;
    if (revokingKeys.has(key)) return;

    setRevokingKeys(prev => new Set(prev).add(key));
    try {
      toast.info('Revoking access...');
      const sig = await revokeAccess(fileName, sharedWith);
      toast.success('Access revoked', {
        description: (
          <a
            href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View transaction →
          </a>
        ),
      });
      setTimeout(refresh, 1200);
    } catch (e: any) {
      console.error('Revoke error:', e);
      toast.error('Failed to revoke', { description: e?.message || 'Unknown error' });
    } finally {
      setRevokingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (!publicKey) {
    return (
      <Card className="glass card-shadow p-8 text-center">
        <p className="text-muted-foreground">Connect your wallet to view shared files</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass card-shadow p-8 text-center">
        <p className="text-muted-foreground">Loading shared files...</p>
      </Card>
    );
  }

  const renderItem = (entry: SharedEntry, canRevoke = false) => {
    const file = entry.file?.account;
    const cid = file?.primaryStorage;
    const accessLevel = Object.keys(entry.sharedAccess.account.accessLevel || { read: {} })[0];
    const expiresAtRaw = (entry.sharedAccess.account.expiresAt?.toNumber?.() ?? entry.sharedAccess.account.expiresAt) as number | null | undefined;

    return (
      <Card key={`${entry.sharedAccess.publicKey?.toBase58?.() || Math.random()}`} className="glass card-shadow p-6 hover:border-primary/50 transition-all group">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <File className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base mb-1 truncate">{file?.fileName || 'Unknown File'}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 bg-secondary/10 border-secondary/30 capitalize">{accessLevel}</Badge>
                {expiresAtRaw ? (
                  <Badge variant="outline" className="gap-1 bg-muted/50">Expires {new Date(expiresAtRaw * 1000).toLocaleDateString()}</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 bg-muted/50">No Expiry</Badge>
                )}
                {file?.isPublic ? (
                  <Badge className="bg-secondary/20 text-secondary">Public</Badge>
                ) : (
                  <Badge className="bg-muted/30 text-muted-foreground">Private</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {cid && (
              <Button variant="outline" size="sm" onClick={() => handleOpenExternal(cid)} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" /> Open
              </Button>
            )}
            {cid && (
              <Button variant="outline" size="sm" onClick={() => handleCopyLink(cid)} className="w-full">
                <Share2 className="w-4 h-4 mr-2" /> Copy Link
              </Button>
            )}
            {!cid && (
              <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-2"><Shield className="w-3 h-3" /> File storage not registered</div>
            )}
            {canRevoke && entry.file && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevoke(entry)}
                className="w-full col-span-2"
                disabled={revokingKeys.has(`${entry.file.account.fileName}-${entry.sharedAccess.account.sharedWith.toBase58?.() || ''}`)}
              >
                Revoke Access
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Shared with you</h3>
          <Label className="text-xs text-muted-foreground">Files others shared to your wallet</Label>
        </div>
        {withMe.length === 0 ? (
          <Card className="glass card-shadow p-8 text-center">
            <p className="text-muted-foreground">No files have been shared with you yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {withMe.map((e) => renderItem(e, false))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">You've shared</h3>
          <Label className="text-xs text-muted-foreground">Files you granted access to others</Label>
        </div>
        {iShared.length === 0 ? (
          <Card className="glass card-shadow p-8 text-center">
            <p className="text-muted-foreground">You haven't shared any files yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {iShared.map((e) => renderItem(e, true))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SharedFiles;
