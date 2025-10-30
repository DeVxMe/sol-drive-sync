import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';
import { useLighthouse } from '@/hooks/useLighthouse';
import { toast } from 'sonner';
import crypto from 'crypto-js';

export const FileUpload = ({ onUploadComplete }: { onUploadComplete?: () => void }) => {
  const { publicKey } = useWallet();
  const { createFile, registerStorage, finalizeFile } = useSoldriveProgram();
  const { uploadChunked } = useLighthouse();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !publicKey) return;

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Calculate file hash
      setCurrentStep('Calculating file hash...');
      setProgress(20);
      
      const reader = new FileReader();
      const fileBuffer = await new Promise<ArrayBuffer>((resolve) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });

      const wordArray = crypto.lib.WordArray.create(fileBuffer as any);
      const hash = crypto.SHA256(wordArray);
      const hashArray = Array.from({ length: 32 }, (_, i) => 
        parseInt(hash.toString().substr(i * 2, 2), 16)
      );

      // Step 2: Create file record on blockchain
      setCurrentStep('Creating file record...');
      setProgress(40);
      
      const chunkCount = Math.ceil(file.size / (1024 * 1024));
      await createFile(file.name, file.size, hashArray, chunkCount);

      // Step 3: Upload to IPFS via Lighthouse
      setCurrentStep('Uploading to IPFS...');
      const ipfsCid = await uploadChunked(file, (p) => {
        setProgress(40 + (p * 0.4));
      });

      // Step 4: Register storage location
      setCurrentStep('Registering storage...');
      setProgress(85);
      
      const merkleRoot = Array(32).fill(0);
      await registerStorage(file.name, ipfsCid, merkleRoot);

      // Step 5: Finalize file
      setCurrentStep('Finalizing...');
      setProgress(95);
      
      await finalizeFile(file.name);

      setProgress(100);
      setCurrentStep('Complete!');
      
      toast.success('File uploaded successfully!', {
        description: `${file.name} is now on the blockchain`,
      });

      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  return (
    <Card className="glass card-shadow p-8">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 glow">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : progress === 100 ? (
            <CheckCircle2 className="w-8 h-8 text-secondary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Upload to SolDrive</h3>
        <p className="text-muted-foreground mb-6">
          Decentralized storage on Solana + IPFS
        </p>

        {uploading && (
          <div className="mb-6">
            <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{currentStep}</p>
          </div>
        )}

        <Button
          variant="default"
          className="relative overflow-hidden group"
          disabled={!publicKey || uploading}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <span className="relative z-10">
            {uploading ? 'Uploading...' : 'Choose File'}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>

        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          disabled={uploading}
        />

        {!publicKey && (
          <p className="text-sm text-destructive mt-4">
            Please connect your wallet first
          </p>
        )}
      </div>
    </Card>
  );
};
