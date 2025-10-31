import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, HardDrive, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';
import { toast } from 'sonner';

export const UserProfile = () => {
  const { publicKey } = useWallet();
  const { createUserProfile, getUserProfilePDA, program } = useSoldriveProgram();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!publicKey || !program) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profilePDA = await getUserProfilePDA(publicKey);
        const info = await program.provider.connection.getAccountInfo(profilePDA);
        if (info) {
          // Account exists; we can't decode without account codecs, but mark as present
          setProfile({});
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [publicKey, program]);

  const handleCreateProfile = async () => {
    try {
      await createUserProfile();
      toast.success('Profile created successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile');
    }
  };

  if (!publicKey) return null;

  if (loading) {
    return (
      <Card className="glass card-shadow p-6">
        <p className="text-muted-foreground text-center">Loading profile...</p>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="glass card-shadow p-6 text-center">
        <User className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
        <p className="text-muted-foreground mb-4">
          Initialize your SolDrive account to start uploading files
        </p>
        <Button onClick={handleCreateProfile} className="glow">
          Create Profile
        </Button>
      </Card>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Card className="glass card-shadow p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center glow">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Your Profile</h3>
          <p className="text-sm text-muted-foreground">
            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Files</p>
            <p className="font-semibold">{profile.filesOwned?.toString() || '0'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
          <HardDrive className="w-5 h-5 text-secondary" />
          <div>
            <p className="text-sm text-muted-foreground">Storage</p>
            <p className="font-semibold">{formatBytes(profile.storageUsed?.toNumber() || 0)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
