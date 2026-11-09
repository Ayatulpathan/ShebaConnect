import argon2 from 'argon2';

/**
 * Hashes a plaintext password using Argon2id (OWASP recommended algorithm)
 */
export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
};

/**
 * Compares plaintext password against an Argon2id hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};
