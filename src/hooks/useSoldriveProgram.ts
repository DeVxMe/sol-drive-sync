import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useMemo } from 'react';
import { SOLDRIVE_IDL } from '@/lib/solana/idl';
import { PROGRAM_ID } from '@/lib/solana/config';

export const useSoldriveProgram = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    return new Program(SOLDRIVE_IDL as any, provider);
  }, [connection, wallet]);

  const getUserProfilePDA = async (userPubkey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_profile'), userPubkey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  const getConfigPDA = async () => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID
    );
    return pda;
  };

  const getFileRecordPDA = async (owner: PublicKey, fileName: string) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('file'), owner.toBuffer(), Buffer.from(fileName)],
      PROGRAM_ID
    );
    return pda;
  };

  const createUserProfile = async () => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const userProfilePDA = await getUserProfilePDA(wallet.publicKey);
    const conn = program.provider.connection;
    const existing = await conn.getAccountInfo(userProfilePDA);
    if (existing) {
      return 'already-initialized';
    }

    const tx = await (program.methods as any)
      .createUserProfile()
      .accounts({
        userProfile: userProfilePDA,
        user: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  };

  const createFile = async (
    fileName: string,
    fileSize: number,
    fileHash: number[],
    chunkCount: number
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const timestamp = new BN(Math.floor(Date.now() / 1000));

    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);
    const configPDA = await getConfigPDA();
    const userProfilePDA = await getUserProfilePDA(wallet.publicKey);

    const conn = program.provider.connection;
    const [configInfo, profileInfo] = await Promise.all([
      conn.getAccountInfo(configPDA),
      conn.getAccountInfo(userProfilePDA),
    ]);

    if (!configInfo) {
      await (program.methods as any)
        .initialize()
        .accounts({
          config: configPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }

    if (!profileInfo) {
      await createUserProfile();
    }

    const tx = await (program.methods as any)
      .createFile(fileName, new BN(fileSize), fileHash, chunkCount, timestamp)
      .accounts({
        fileRecord: fileRecordPDA,
        config: configPDA,
        userProfile: userProfilePDA,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  };

  const registerStorage = async (fileName: string, ipfsCid: string, merkleRoot: number[]) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);

    const tx = await (program.methods as any)
      .registerStorage(ipfsCid, merkleRoot)
      .accounts({
        fileRecord: fileRecordPDA,
        owner: wallet.publicKey,
      })
      .rpc();

    return tx;
  };

  const finalizeFile = async (fileName: string) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);

    const tx = await (program.methods as any)
      .finalizeFile()
      .accounts({
        fileRecord: fileRecordPDA,
        owner: wallet.publicKey,
      })
      .rpc();

    return tx;
  };

  const getUserFiles = async () => {
    if (!program || !wallet.publicKey) return [];

    try {
      const programAccounts = program as any;
      const hasFileRecordAccount = programAccounts?.account?.fileRecord;
      
      if (!hasFileRecordAccount) {
        return [];
      }

      const accounts = await programAccounts.account.fileRecord.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      return accounts;
    } catch (error) {
      // Silently handle errors to prevent console spam
      if (error?.message?.includes('rate limited')) {
        console.warn('Rate limited, retrying in next fetch cycle');
      } else {
        console.error('Error fetching files:', error);
      }
      return [];
    }
  };

  const makePublic = async (fileName: string) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);

    const tx = await (program.methods as any)
      .makePublic()
      .accounts({
        fileRecord: fileRecordPDA,
        owner: wallet.publicKey,
      })
      .rpc();

    return tx;
  };

  const makePrivate = async (fileName: string) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);

    const tx = await (program.methods as any)
      .makePrivate()
      .accounts({
        fileRecord: fileRecordPDA,
        owner: wallet.publicKey,
      })
      .rpc();

    return tx;
  };

  const getSharedAccessPDA = async (fileRecordPDA: PublicKey, sharedWith: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('shared_access'), fileRecordPDA.toBuffer(), sharedWith.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  const grantAccess = async (
    fileName: string,
    sharedWithAddress: string,
    accessLevel: { read?: {} } | { write?: {} } | { admin?: {} },
    expiresAt?: number
  ) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const sharedWith = new PublicKey(sharedWithAddress);
    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);
    const sharedAccessPDA = await getSharedAccessPDA(fileRecordPDA, sharedWith);

    const expiresAtBN = expiresAt ? new BN(expiresAt) : null;

    const tx = await (program.methods as any)
      .grantAccess(sharedWith, accessLevel, expiresAtBN)
      .accounts({
        sharedAccess: sharedAccessPDA,
        fileRecord: fileRecordPDA,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  };

  const revokeAccess = async (fileName: string, sharedWithAddress: string) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const sharedWith = new PublicKey(sharedWithAddress);
    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);
    const sharedAccessPDA = await getSharedAccessPDA(fileRecordPDA, sharedWith);

    const tx = await (program.methods as any)
      .revokeAccess()
      .accounts({
        sharedAccess: sharedAccessPDA,
        fileRecord: fileRecordPDA,
        owner: wallet.publicKey,
      })
      .rpc();

    return tx;
  };

  const getFileSharedAccess = async (fileName: string) => {
    if (!program || !wallet.publicKey) return [];

    try {
      const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);
      const programAccounts = program as any;
      
      if (!programAccounts?.account?.sharedAccess) {
        return [];
      }

      const accounts = await programAccounts.account.sharedAccess.all([
        {
          memcmp: {
            offset: 8,
            bytes: fileRecordPDA.toBase58(),
          },
        },
      ]);

      return accounts;
    } catch (error) {
      console.error('Error fetching shared access:', error);
      return [];
    }
  };

  const getFilesSharedWithMe = async () => {
    if (!program || !wallet.publicKey) return [];

    try {
      const programAny = program as any;
      if (!programAny?.account?.sharedAccess) return [];

      // shared_with offset = 8 (disc) + 32 (file_record) + 32 (owner) = 72
      const accounts = await programAny.account.sharedAccess.all([
        {
          memcmp: {
            offset: 72,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      const active = accounts.filter((a: any) => a.account.isActive);

      const withFiles = await Promise.all(
        active.map(async (sa: any) => {
          try {
            const fileAccount = await programAny.account.fileRecord.fetch(sa.account.fileRecord);
            return {
              sharedAccess: sa,
              file: { publicKey: sa.account.fileRecord, account: fileAccount },
            };
          } catch {
            return { sharedAccess: sa, file: null };
          }
        })
      );

      return withFiles;
    } catch (e) {
      console.error('Error fetching files shared with me:', e);
      return [];
    }
  };

  const getFilesIShared = async () => {
    if (!program || !wallet.publicKey) return [];

    try {
      const programAny = program as any;
      if (!programAny?.account?.sharedAccess) return [];

      // owner offset = 8 (disc) + 32 (file_record) = 40
      const accounts = await programAny.account.sharedAccess.all([
        {
          memcmp: {
            offset: 40,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      const active = accounts.filter((a: any) => a.account.isActive);

      const withFiles = await Promise.all(
        active.map(async (sa: any) => {
          try {
            const fileAccount = await programAny.account.fileRecord.fetch(sa.account.fileRecord);
            return {
              sharedAccess: sa,
              file: { publicKey: sa.account.fileRecord, account: fileAccount },
            };
          } catch {
            return { sharedAccess: sa, file: null };
          }
        })
      );

      return withFiles;
    } catch (e) {
      console.error('Error fetching files I shared:', e);
      return [];
    }
  };

  return {
    program,
    createUserProfile,
    createFile,
    registerStorage,
    finalizeFile,
    getUserFiles,
    getUserProfilePDA,
    getConfigPDA,
    getFileRecordPDA,
    makePublic,
    makePrivate,
    grantAccess,
    revokeAccess,
    getSharedAccessPDA,
    getFileSharedAccess,
    getFilesSharedWithMe,
    getFilesIShared,
  };
};
