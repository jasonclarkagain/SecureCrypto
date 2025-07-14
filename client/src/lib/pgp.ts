// @ts-ignore
const openpgp = window.openpgp;

export interface PGPKeyPair {
  publicKey: string;
  privateKey: string;
  keyInfo: {
    name: string;
    email: string;
    keyId: string;
    created: Date;
    keySize: number;
  };
}

export interface EncryptionResult {
  encryptedData: string;
  success: boolean;
  error?: string;
}

export interface DecryptionResult {
  decryptedData: string;
  success: boolean;
  error?: string;
}

export class PGPService {
  static async generateKeyPair(
    name: string,
    email: string,
    passphrase?: string,
    keySize: number = 4096
  ): Promise<PGPKeyPair> {
    try {
      const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: keySize,
        userIDs: [{ name, email }],
        passphrase: passphrase || undefined,
        format: 'armored'
      });

      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      const keyId = publicKeyObj.getKeyIDs()[0].toHex();

      return {
        publicKey,
        privateKey,
        keyInfo: {
          name,
          email,
          keyId,
          created: new Date(),
          keySize
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async encryptText(
    text: string,
    publicKeyArmored: string
  ): Promise<EncryptionResult> {
    try {
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
      
      const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text }),
        encryptionKeys: publicKey,
        format: 'armored'
      });

      return {
        encryptedData: encrypted as string,
        success: true
      };
    } catch (error) {
      return {
        encryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown encryption error'
      };
    }
  }

  static async decryptText(
    encryptedText: string,
    privateKeyArmored: string,
    passphrase?: string
  ): Promise<DecryptionResult> {
    try {
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase: passphrase || ''
      });

      const message = await openpgp.readMessage({ armoredMessage: encryptedText });
      
      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: 'utf8'
      });

      return {
        decryptedData: decrypted as string,
        success: true
      };
    } catch (error) {
      return {
        decryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown decryption error'
      };
    }
  }

  static async encryptFile(
    file: File,
    publicKeyArmored: string,
    onProgress?: (progress: number) => void
  ): Promise<EncryptionResult> {
    try {
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
      
      // Convert file to binary data
      const fileData = new Uint8Array(await file.arrayBuffer());
      
      if (onProgress) onProgress(25);

      const message = await openpgp.createMessage({ binary: fileData, filename: file.name });
      
      if (onProgress) onProgress(50);

      const encrypted = await openpgp.encrypt({
        message,
        encryptionKeys: publicKey,
        format: 'armored'
      });

      if (onProgress) onProgress(100);

      return {
        encryptedData: encrypted as string,
        success: true
      };
    } catch (error) {
      return {
        encryptedData: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file encryption error'
      };
    }
  }

  static async decryptFile(
    encryptedData: string,
    privateKeyArmored: string,
    passphrase?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ data: Uint8Array; filename: string; success: boolean; error?: string }> {
    try {
      if (onProgress) onProgress(25);

      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase: passphrase || ''
      });

      if (onProgress) onProgress(50);

      const message = await openpgp.readMessage({ armoredMessage: encryptedData });
      
      const { data: decrypted, filename } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
        format: 'binary'
      });

      if (onProgress) onProgress(100);

      return {
        data: decrypted as Uint8Array,
        filename: filename || 'decrypted_file',
        success: true
      };
    } catch (error) {
      return {
        data: new Uint8Array(),
        filename: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file decryption error'
      };
    }
  }

  static async validateKey(keyArmored: string, type: 'public' | 'private'): Promise<boolean> {
    try {
      if (type === 'public') {
        await openpgp.readKey({ armoredKey: keyArmored });
      } else {
        await openpgp.readPrivateKey({ armoredKey: keyArmored });
      }
      return true;
    } catch {
      return false;
    }
  }

  static async getKeyInfo(keyArmored: string): Promise<{
    keyId: string;
    userIds: string[];
    created: Date;
    keySize: number;
  } | null> {
    try {
      const key = await openpgp.readKey({ armoredKey: keyArmored });
      const primaryUser = await key.getPrimaryUser();
      
      return {
        keyId: key.getKeyIDs()[0].toHex(),
        userIds: key.getUserIDs(),
        created: key.getCreationTime(),
        keySize: key.getAlgorithmInfo().bits || 0
      };
    } catch {
      return null;
    }
  }
}
