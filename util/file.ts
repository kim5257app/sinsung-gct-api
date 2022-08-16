import fs from 'fs';
import sharp from 'sharp';
import { imageSize } from 'image-size';
import { WorkSheet } from 'xlsx';
import { Error } from '../debug/error';
import Config from '../config/config.json';

export interface FilePayload {
  name: string;
  size: number;
  data: ArrayBuffer[];
}

function makePrefix() {
  const date = new Date();
  return date.getTime().toString();
}

function combineBuffer(buffers: ArrayBuffer[]) {
  const size = buffers.reduce<number>((total, buf) => (total + buf.byteLength), 0);
  const bytes = new Uint8Array(size);

  let offset = 0;
  buffers.forEach((buf) => {
    bytes.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  });

  return bytes;
}

function divideBuffer(buf: ArrayBuffer, payloadUnit = 1500) {
  const data: ArrayBuffer[] = [];
  const last = buf.byteLength;

  for (let idx=0; idx < last; idx += payloadUnit) {
    data.push(buf.slice(idx, idx + payloadUnit));
  }

  return data;
}

function writeFile(path: string, buffer: Uint8Array) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, buffer, (error) => {
      if (error != null) {
        reject(Error.makeError(error));
      } else {
        resolve(true);
      }
    });
  });
}

function readFile(path: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (error, data) => {
      if (error != null) {
        reject(Error.makeError(error));
      } else {
        resolve(data);
      }
    });
  });
}

export default {
  async readImageSize(file: string) {
    return imageSize(file);
  },
  async adjustXLSXHeaders(sheet: WorkSheet, headerTable: {[key: string]:string}) {
    const keys = Object.keys(sheet);

    const rowStart = parseInt(keys[1].replace(/[A-Z]/g, ''));
    for (let offset=1; keys[offset]; offset += 1) {
      const rowNum = parseInt(keys[offset].replace(/[A-Z]/g, ''));

      // 숫자 넘어가면 데이터 영역으로 판단
      if (rowNum > rowStart) {
        break;
      }

      const newName = headerTable[sheet[keys[offset]].w];
      if (newName != null) {
        sheet[keys[offset]].w = newName;
      }
    }

    return sheet;
  },
  async writeFileFromPayload(filePayload: FilePayload) {
    // 파일 저장
    const buffer = combineBuffer(filePayload.data);
    const fileName = `${makePrefix()}_${filePayload.name}`;

    await writeFile(`${Config.uploads.path}/${fileName}`, buffer);

    // 기록된 정보로 회신
    return {
      fileName,
    };
  },
  async readFileToPayload(fileName: string) {
    // 파일 정보 참조
    const data = await readFile(`${Config.uploads.path}/${fileName}`);

    return {
      fileName,
      size: data.byteLength,
      data: divideBuffer(data),
    };
  },
  async resizeImage(data: Uint8Array, width: number, height?: number) {
    return sharp(data)
      .resize({ width })
      .toBuffer();
  },
  async buffersToJson(buffers: ArrayBuffer[]) {
    const buf = combineBuffer(buffers);
    return this.bufferToJson(buf);
  },
  async bufferToJson(buf: Uint8Array) {
    const textDecoder = new TextDecoder('utf-8');
    const arrayBuf = Uint8Array.from(buf);
    return textDecoder.decode(arrayBuf);
  },
  async jsonToBuffer(data: string): Promise<ArrayBuffer> {
    const textEncoder = new TextEncoder();
    return textEncoder.encode(data).buffer;
  },
  async jsonToBuffers(data: string): Promise<ArrayBuffer[]> {
    const buf = await this.jsonToBuffer(data);
    return divideBuffer(buf);
  },
  combineBuffer,
  divideBuffer,
};
