import { LIGHTHOUSE_API_KEY } from '@/lib/solana/config';

export const useLighthouse = () => {
  const uploadFile = async (file: File): Promise<{ Hash: string; Size: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://node.lighthouse.storage/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIGHTHOUSE_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Lighthouse');
    }

    const data = await response.json();
    return data;
  };

  const uploadChunked = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    // For simplicity, we'll use the single upload endpoint
    // In production, you'd implement proper chunked upload
    const result = await uploadFile(file);
    
    if (onProgress) {
      onProgress(100);
    }

    return result.Hash;
  };

  return {
    uploadFile,
    uploadChunked,
  };
};
