import lighthouse from '@lighthouse-web3/sdk';
import { LIGHTHOUSE_API_KEY } from '@/lib/solana/config';

export const useLighthouse = () => {
  const uploadFile = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ Hash: string; Size: number }> => {
    try {
      const progressCallback = (data: any) => {
        const percentageDone = (data.uploaded / data.total) * 100;
        if (onProgress) onProgress(Math.round(percentageDone));
      };

      // Wrap file inside an array
      const output = await lighthouse.upload(
        [file],
        LIGHTHOUSE_API_KEY,
        1,
        progressCallback
      );

      return {
        Hash: output.data.Hash,
        Size: file.size,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const uploadChunked = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    try {
      const progressCallback = (data: any) => {
        const percentageDone = (data.uploaded / data.total) * 100;
        if (onProgress) onProgress(Math.round(percentageDone));
      };

      // Again, wrap file in array
      const output = await lighthouse.upload(
        [file],
        LIGHTHOUSE_API_KEY,
        1,
        progressCallback
      );

      if (onProgress) onProgress(100);
      return output.data.Hash;
    } catch (error) {
      console.error('Chunked upload error:', error);
      throw error;
    }
  };

  return { uploadFile, uploadChunked };
};
