import { useState, useCallback } from 'react';
import { PGPService, PGPKeyPair, EncryptionResult, DecryptionResult } from '@/lib/pgp';
import { PGPStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export function usePGP() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateKeyPair = useCallback(async (
    name: string,
    email: string,
    passphrase?: string,
    keySize: number = 4096
  ): Promise<PGPKeyPair | null> => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const keyPair = await PGPService.generateKeyPair(name, email, passphrase, keySize);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Key pair generated!",
        description: "Your PGP key pair has been successfully created.",
      });

      return keyPair;
    } catch (error) {
      toast({
        title: "Key generation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [toast]);

  const encryptText = useCallback(async (
    text: string,
    publicKey: string
  ): Promise<EncryptionResult> => {
    setIsEncrypting(true);

    try {
      const result = await PGPService.encryptText(text, publicKey);
      
      if (result.success) {
        toast({
          title: "Text encrypted",
          description: "Your message has been successfully encrypted.",
        });
      } else {
        toast({
          title: "Encryption failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorResult: EncryptionResult = {
        encryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast({
        title: "Encryption failed",
        description: errorResult.error,
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsEncrypting(false);
    }
  }, [toast]);

  const decryptText = useCallback(async (
    encryptedText: string,
    privateKey: string,
    passphrase?: string
  ): Promise<DecryptionResult> => {
    setIsDecrypting(true);

    try {
      const result = await PGPService.decryptText(encryptedText, privateKey, passphrase);
      
      if (result.success) {
        toast({
          title: "Text decrypted",
          description: "Your message has been successfully decrypted.",
        });
      } else {
        toast({
          title: "Decryption failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorResult: DecryptionResult = {
        decryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast({
        title: "Decryption failed",
        description: errorResult.error,
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsDecrypting(false);
    }
  }, [toast]);

  const encryptFile = useCallback(async (
    file: File,
    publicKey: string
  ): Promise<EncryptionResult> => {
    setIsEncrypting(true);
    setProgress(0);

    try {
      const result = await PGPService.encryptFile(file, publicKey, setProgress);
      
      if (result.success) {
        toast({
          title: "File encrypted",
          description: `${file.name} has been successfully encrypted.`,
        });
      } else {
        toast({
          title: "File encryption failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorResult: EncryptionResult = {
        encryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast({
        title: "File encryption failed",
        description: errorResult.error,
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsEncrypting(false);
      setProgress(0);
    }
  }, [toast]);

  const decryptFile = useCallback(async (
    encryptedData: string,
    privateKey: string,
    passphrase?: string
  ): Promise<{ data: Uint8Array; filename: string; success: boolean; error?: string }> => {
    setIsDecrypting(true);
    setProgress(0);

    try {
      const result = await PGPService.decryptFile(encryptedData, privateKey, passphrase, setProgress);
      
      if (result.success) {
        toast({
          title: "File decrypted",
          description: "Your file has been successfully decrypted.",
        });
      } else {
        toast({
          title: "File decryption failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorResult = {
        data: new Uint8Array(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      toast({
        title: "File decryption failed",
        description: errorResult.error,
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsDecrypting(false);
      setProgress(0);
    }
  }, [toast]);

  const validateKey = useCallback(async (
    keyArmored: string,
    type: 'public' | 'private'
  ): Promise<boolean> => {
    return PGPService.validateKey(keyArmored, type);
  }, []);

  const saveKeyPair = useCallback((keyPair: PGPKeyPair, nickname?: string): string => {
    const id = PGPStorage.saveKeyPair(keyPair, nickname);
    toast({
      title: "Key pair saved",
      description: "Your key pair has been saved to browser storage.",
    });
    return id;
  }, [toast]);

  const downloadFile = useCallback((content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadBinaryFile = useCallback((data: Uint8Array, filename: string) => {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    // State
    isGenerating,
    isEncrypting,
    isDecrypting,
    progress,

    // Actions
    generateKeyPair,
    encryptText,
    decryptText,
    encryptFile,
    decryptFile,
    validateKey,
    saveKeyPair,
    downloadFile,
    downloadBinaryFile,
  };
}
