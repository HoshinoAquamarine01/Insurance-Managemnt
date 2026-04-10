const crypto = require("crypto");
const env = require("../config/env");

const IV_LENGTH = 12;
const ALGORITHM = "aes-256-gcm";
const keyBuffer = Buffer.from(env.appAesKey, "hex");

if (keyBuffer.length !== 32) {
  throw new Error("APP_AES_KEY must be 64 hex chars (32 bytes)");
}

function encryptText(plainText) {
  if (!plainText) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: authTag.toString("hex"),
  };
}

function decryptText(payload) {
  if (!payload || !payload.iv || !payload.content || !payload.tag) return null;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyBuffer,
    Buffer.from(payload.iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = { encryptText, decryptText };
