import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FileData {
  id: string;
  fileName: string;
  fileSize: number;
  primaryStorage: string;
  status: 'uploading' | 'processing' | 'active' | 'archived' | 'deleted';
  isPublic: boolean;
  createdAt: number;
  owner: string;
}

interface FileStore {
  files: FileData[];
  totalStorage: number;
  addFile: (file: FileData) => void;
  updateFileStatus: (id: string, status: FileData['status']) => void;
  getFilesByOwner: (owner: string) => FileData[];
  clearFiles: () => void;
}

export const useFileStore = create<FileStore>()(
  persist(
    (set, get) => ({
      files: [],
      totalStorage: 0,
      addFile: (file) =>
        set((state) => ({
          files: [...state.files, file],
          totalStorage: state.totalStorage + file.fileSize,
        })),
      updateFileStatus: (id, status) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, status } : f
          ),
        })),
      getFilesByOwner: (owner) => get().files.filter((f) => f.owner === owner),
      clearFiles: () => set({ files: [], totalStorage: 0 }),
    }),
    {
      name: 'soldrive-storage',
    }
  )
);
