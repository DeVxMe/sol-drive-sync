import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  ipfsCid: string;
  fileSize: number;
}

export const FileViewer = ({ isOpen, onClose, fileName, ipfsCid, fileSize }: FileViewerProps) => {
  const [loading, setLoading] = useState(true);
  const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsCid}`;

  const handleDownload = async () => {
    try {
      toast.info('Downloading file...', {
        description: 'Please wait while we fetch your file',
      });

      const response = await fetch(ipfsUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download complete!', {
        description: `${fileName} has been downloaded`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getFileType = () => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['pdf'].includes(ext || '')) return 'pdf';
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
    if (['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html'].includes(ext || '')) return 'text';
    return 'other';
  };

  const fileType = getFileType();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{fileName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatFileSize(fileSize)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(ipfsUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          )}

          {fileType === 'image' && (
            <img
              src={ipfsUrl}
              alt={fileName}
              className="max-w-full h-auto mx-auto rounded-lg"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                toast.error('Failed to load image');
              }}
            />
          )}

          {fileType === 'pdf' && (
            <iframe
              src={ipfsUrl}
              className="w-full h-full min-h-[500px] rounded-lg"
              title={fileName}
              onLoad={() => setLoading(false)}
            />
          )}

          {fileType === 'video' && (
            <video
              src={ipfsUrl}
              controls
              className="max-w-full h-auto mx-auto rounded-lg"
              onLoadedData={() => setLoading(false)}
            >
              Your browser does not support the video tag.
            </video>
          )}

          {fileType === 'audio' && (
            <div className="flex items-center justify-center h-full">
              <audio
                src={ipfsUrl}
                controls
                className="w-full max-w-md"
                onLoadedData={() => setLoading(false)}
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          {fileType === 'text' && (
            <iframe
              src={ipfsUrl}
              className="w-full h-full min-h-[500px] rounded-lg bg-background"
              title={fileName}
              onLoad={() => setLoading(false)}
            />
          )}

          {fileType === 'other' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <ExternalLink className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Preview not available</h3>
              <p className="text-muted-foreground mb-6">
                This file type cannot be previewed directly.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
                <Button variant="outline" onClick={() => window.open(ipfsUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
