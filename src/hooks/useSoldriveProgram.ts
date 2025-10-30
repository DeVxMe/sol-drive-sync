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

    const tx = await program.methods
      .createUserProfile()
      .accounts({
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

    const tx = await program.methods
      .createFile(fileName, new BN(fileSize), fileHash, chunkCount, timestamp)
      .accounts({
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
      const accounts = await (program.account as any).fileRecord.all([
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
