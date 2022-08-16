import * as crypto from 'crypto';
import { sha3_512 } from 'js-sha3';
import * as jwt from 'jsonwebtoken'
import config from '../config/config.json';
import { JwtPayload } from "jsonwebtoken";

const opts: {[key: string]: object} = {
  access: {
    ...config.jwt.options.access,
    mutatePayload: true,
  },
  file: {
    ...config.jwt.options.file,
    mutatePayload: true,
  },
  thirdParty: {
    ...config.thirdParty.options,
    mutatePayload: true,
  },
};

export default {
  toHash(password: string) {
    return sha3_512(password);
  },
  makeToken(payload: { [key: string]: string | number }) {
    return jwt.sign(payload, config.jwt.secret, opts.access);
  },
  verifyToken(token: string) {
    return jwt.verify(token, config.jwt.secret, opts.access) as JwtPayload;
  },
  makeFileToken(payload: { [key: string]: string | number }) {
    return jwt.sign(payload, config.jwt.secret, opts.file);
  },
  verifyFileToken(token: string) {
    return jwt.verify(token, config.jwt.secret, opts.file) as JwtPayload;
  },
  makeThirdPartyToken(payload: { [key: string]: string | number }, secret: string) {
    return jwt.sign(payload, secret, opts.thirdParty);
  },
  verifyThirdPartyToken(token: string, secret: string) {
    return jwt.verify(token, secret, opts.thirdParty) as JwtPayload;
  },
  decodeThirdPartyToken(token: string) {
    return jwt.decode(token, { ...opts.thirdParty, json: true }) as JwtPayload;
  },
  makeCipher(data: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(config.aes.providers),
      iv,
    );
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  },
  makeDecipher(data: string) {
    const textParts = data.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(config.aes.providers),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
};
