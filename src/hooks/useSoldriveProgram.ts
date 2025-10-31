import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useMemo } from 'react';
import { SOLDRIVE_IDL, SoldriveIDL } from '@/lib/solana/idl';
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
      // Already initialized; make this call idempotent
      return 'already-initialized';
    }

    const tx = await program.methods
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

    // Derive PDAs
    const fileRecordPDA = await getFileRecordPDA(wallet.publicKey, fileName);
    const configPDA = await getConfigPDA();
    const userProfilePDA = await getUserProfilePDA(wallet.publicKey);

    // Ensure required accounts exist
    const conn = program.provider.connection;
    const [configInfo, profileInfo] = await Promise.all([
      conn.getAccountInfo(configPDA),
      conn.getAccountInfo(userProfilePDA),
    ]);

    if (!configInfo) {
      await program.methods
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

    const tx = await program.methods
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

    const tx = await program.methods
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

    const tx = await program.methods
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
      const hasAllHelper = programAccounts?.account?.fileRecord?.all;
      if (!hasAllHelper) {
        console.warn('Anchor account codecs not available in IDL; skipping fetch.');
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
      console.error('Error fetching files:', error);
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
  };
};
