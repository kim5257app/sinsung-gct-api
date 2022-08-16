interface ErrorInfo {
  result?: String;
  code?: String;
  name?: String;
  message?: String;
}

export class Error {
  result: String = 'error';
  code: String = '-1';
  name: String = 'ERROR';
  message: String = 'ERROR';

  constructor(error: unknown) {
    const info = error as ErrorInfo;

    this.result = info.result ? info.result : 'error';
    this.code = info.code ? info.code : '-1';
    this.name = info.name ? info.name : 'ERROR';
    this.message = info.message ? info.message : 'ERROR';
  }

  toString(): String {
    return JSON.stringify({
      result: this.result,
      code: this.code,
      name: this.name,
      message: this.message,
    });
  }

  public static makeError(error: unknown): Error {
    return new Error(error);
  }

  public static makeThrow(error: unknown): never {
    throw new Error(error);
  }
}
