import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, HardDrive, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';
import { toast } from 'sonner';

interface UserProfileData {
  filesOwned: number;
  storageUsed: number;
  storagePaidUntil: number;
  reputationScore: number;
}

export const UserProfile = () => {
  const { publicKey } = useWallet();
  const { createUserProfile, getUserProfilePDA, program } = useSoldriveProgram();
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkProfile = async () => {
      if (!publicKey || !program) {
        setHasProfile(false);
        setProfileData(null);
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const userProfilePDA = await getUserProfilePDA(publicKey);
        const connection = program.provider.connection;
        
        const accountInfo = await connection.getAccountInfo(userProfilePDA);
        
        if (!isMounted) return;
        
        if (accountInfo) {
          setHasProfile(true);
          
          // Fetch profile data
          try {
            const profileAccount = await (program as any).account.userProfile.fetch(userProfilePDA);
            if (isMounted) {
              setProfileData({
                filesOwned: profileAccount.filesOwned?.toNumber() || 0,
                storageUsed: profileAccount.storageUsed?.toNumber() || 0,
                storagePaidUntil: profileAccount.storagePaidUntil?.toNumber() || 0,
                reputationScore: profileAccount.reputationScore || 0,
              });
            }
          } catch (error) {
            console.error('Error fetching profile data:', error);
          }
        } else {
          setHasProfile(false);
          setProfileData(null);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
        setProfileData(null);
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    checkProfile();
    
    return () => {
      isMounted = false;
    };
  }, [publicKey, program]);

  const handleCreateProfile = async () => {
    setLoading(true);
    try {
      const result = await createUserProfile();
      if (result === 'already-initialized') {
        toast.info('Profile already exists');
        setHasProfile(true);
      } else {
        toast.success('Profile created successfully!');
        setHasProfile(true);
        // Reload profile data
        const profilePDA = await getUserProfilePDA(publicKey!);
        const profileAccount = await (program as any).account.userProfile.fetch(profilePDA);
        setProfileData({
          filesOwned: profileAccount.filesOwned?.toNumber() || 0,
          storageUsed: profileAccount.storageUsed?.toNumber() || 0,
          storagePaidUntil: profileAccount.storagePaidUntil?.toNumber() || 0,
          reputationScore: profileAccount.reputationScore || 0,
        });
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      const errorMsg = error?.message || 'Failed to create profile';
      if (errorMsg.includes('already been processed')) {
        toast.info('Profile creation in progress, please wait...');
        setTimeout(async () => {
          const profilePDA = await getUserProfilePDA(publicKey!);
          const info = await program!.provider.connection.getAccountInfo(profilePDA);
          if (info) {
            setHasProfile(true);
            const profileAccount = await (program as any).account.userProfile.fetch(profilePDA);
            setProfileData({
              filesOwned: profileAccount.filesOwned?.toNumber() || 0,
              storageUsed: profileAccount.storageUsed?.toNumber() || 0,
              storagePaidUntil: profileAccount.storagePaidUntil?.toNumber() || 0,
              reputationScore: profileAccount.reputationScore || 0,
            });
          }
        }, 2000);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) return null;

  if (checking) {
    return (
      <Card className="glass card-shadow p-6">
        <p className="text-muted-foreground text-center">Loading profile...</p>
      </Card>
    );
  }

  if (!hasProfile) {
    return (
      <Card className="glass card-shadow p-6 text-center">
        <User className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
        <p className="text-muted-foreground mb-4">
          Initialize your SolDrive account to start uploading files
        </p>
        <Button onClick={handleCreateProfile} className="glow" disabled={loading}>
          {loading ? 'Creating...' : 'Create Profile'}
        </Button>
      </Card>
    );
  }

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
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{profileData?.filesOwned || 0}</p>
          <p className="text-sm text-muted-foreground">Files</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <HardDrive className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {((profileData?.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB
          </p>
          <p className="text-sm text-muted-foreground">Storage Used</p>
        </div>
      </div>
    </Card>
  );
};
