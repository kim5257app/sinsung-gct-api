import { Socket } from 'socket.io';

type ValueType = string | number | {[key: string]: unknown} | Array<ValueType> | boolean;
type FormType = 'string' | 'number' | 'object' | 'array' | 'boolean' | 'binary'

export interface IRule {
  type: FormType;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
  allow?: Array<string | number>;
  required?: boolean;
  children?: IForm;
  childrenRule?: IRule;
}

export interface IForm {
  [name: string]: IRule;
}

export interface IFormList {
  [name: string]: IForm;
}

function checkForm(data: {[key: string]: unknown}, form: IForm): boolean {
  let confirm = true;

  Object.entries(form).forEach(([key, rule]) => {
    const value = data[key] as ValueType;

    if (!confirm) {
      // Do nothing
    } else if (value == null) {
      confirm = (rule.required != null) && !rule.required;
    } else {
      const type = typeof value;

      if (type === 'object'
        && (rule.type === 'array')
        && !(value instanceof Array)) {
        confirm = false;
      } else if (type === 'object'
        && (rule.type === 'binary')
        && !(value instanceof Uint8Array)) {
        confirm = false;
      } else if (type !== 'object'
        && type !== rule.type) {
        confirm = false;
      }

      if (typeof value === 'string') {
        if (confirm && rule.maxLen != null) {
          confirm = (value.length <= rule.maxLen);
        }

        if (confirm && rule.minLen != null) {
          confirm = (value.length >= rule.minLen);
        }
      }

      if (typeof value === 'number') {
        // 숫자 최대 범위 확인
        if (confirm && rule.max != null) {
          confirm = (value <= rule.max);
        }

        // 숫자 최소 범위 확인
        if (confirm && rule.min != null) {
          confirm = (value >= rule.min);
        }
      }

      // 허용 값 확인
      if (confirm && rule.allow != null) {
        confirm = (rule.allow.find(item => item === data[key]) != null);
      }

      if (confirm
        && typeof value === 'object'
        && rule.children != null
        && !(value instanceof Array)) {
        confirm = checkForm(value, rule.children);
      }

      if (confirm
        && typeof value === 'object'
        && value instanceof Array
        && rule.childrenRule != null) {
        value.forEach((val) => {
          confirm = confirm && checkForm({ temp: val }, { temp: rule.childrenRule! });
        });
      }

      if (confirm
        && typeof value === 'object'
        && rule.children != null) {
        if (value instanceof Array) {
          // Array 일 때의 checkForm 처리
          value.forEach((val) => {
            confirm = confirm && checkForm(val as {[key: string]: unknown}, rule.children!);
          });
        } else if (value instanceof Uint8Array) {
          // binary 일 경우 아무것도 하지 않음
        } else {
          // Object 일 때의 checkForm 처리
          confirm = checkForm(value, rule.children);
        }
      }
    }
  });

  return confirm;
}

function doCheckForm(socket: Socket, forms: {[name: string]: IForm}): void {
  socket.use((([name, data, resp]: any, next: (err?: any) => void) => {
    let confirm: Boolean;

    if (resp == null) {
      confirm = false;
    } else if (forms[name] != null) {
      confirm = checkForm(data, forms[name]);
    } else {
      confirm = false;
    }

    if (confirm) {
      next();
    } else if (resp == null) {
      next({
        name: 'BAD_REQUEST',
        message: 'Missing response callback function',
      });
    } else {
      resp({
        result: 'error',
        name: 'WRONG_VALUE',
        message: `Wrong Argument(${name})`,
      });
    }
  }));
}

export function middleware(forms: IFormList): (socket: Socket, next: (err?: Error) => void) => void {
  return (socket, next): void => {
    doCheckForm(socket, forms);
    next();
  }
}
