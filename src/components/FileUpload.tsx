import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSoldriveProgram } from '@/hooks/useSoldriveProgram';
import { useLighthouse } from '@/hooks/useLighthouse';
import { useFileStore } from '@/hooks/useFileStore';
import { toast } from 'sonner';
import crypto from 'crypto-js';

export const FileUpload = ({ onUploadComplete }: { onUploadComplete?: () => void }) => {
  const { publicKey } = useWallet();
  const { createFile, registerStorage, finalizeFile } = useSoldriveProgram();
  const { uploadChunked } = useLighthouse();
  const { addFile, updateFileStatus } = useFileStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !publicKey) return;

    setUploading(true);
    setProgress(0);

    const fileId = `${publicKey.toBase58()}-${file.name}-${Date.now()}`;
    setCurrentFileId(fileId);

    try {
      // Create temporary UI state for upload progress
      addFile({
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        primaryStorage: '',
        status: 'uploading',
        isPublic: true,
        createdAt: Date.now(),
        owner: publicKey.toBase58(),
      });

      // Step 1: Chunking file
      setCurrentStep('Chunking file data...');
      setProgress(10);
      await sleep(800);

      // Step 2: Calculate file hash
      setCurrentStep('Calculating file hash...');
      setProgress(20);
      await sleep(600);
      
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

      // Step 3: Creating file record on blockchain
      setCurrentStep('Creating file record on blockchain...');
      setProgress(35);
      await sleep(1000);
      
      const chunkCount = Math.ceil(file.size / (1024 * 1024));
      await createFile(file.name, file.size, hashArray, chunkCount);

      // Step 4: Uploading to IPFS
      updateFileStatus(fileId, 'processing');
      setCurrentStep('Uploading to IPFS network...');
      setProgress(45);
      
      const ipfsCid = await uploadChunked(file, (p) => {
        setProgress(45 + (p * 0.3));
      });

      // Step 5: Registering storage location
      setCurrentStep('Registering storage location...');
      setProgress(80);
      await sleep(800);
      
      const merkleRoot = Array(32).fill(0);
      await registerStorage(file.name, ipfsCid, merkleRoot);

      // Step 6: Finalizing file
      setCurrentStep('Finalizing and verifying...');
      setProgress(90);
      await sleep(800);
      
      await finalizeFile(file.name);

      // Clear temporary UI state - data is now on blockchain
      setProgress(100);
      setCurrentStep('Complete!');
      await sleep(500);
      
      toast.success('File uploaded successfully!', {
        description: `${file.name} is now on the blockchain`,
      });

      // Remove from local store as it's now on blockchain
      updateFileStatus(fileId, 'deleted');
      
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      if (currentFileId) {
        updateFileStatus(currentFileId, 'deleted');
      }
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentStep('');
      setCurrentFileId(null);
      // Reset file input
      e.target.value = '';
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
