export default {
  getByteLength(str: string) {
    let len = 0;
    let idx = 0;
    let c = str.charCodeAt(0);

    for (idx = 1; !Number.isNaN(c); idx += 1) {
      len += (c >> 7) ? 2 : 1;
      c = str.charCodeAt(idx);
    }

    return len;
  },
}
