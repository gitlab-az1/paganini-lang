import native from '../_internals/native';
import { Exception } from '../_internals/errors';
import { MAKE_NATIVE_METHOD, MAKE_BOOL, MAKE_NULL, RuntimeValue, ObjectValue } from './values';


export function createGlobalEnvironment(parent?: Environment): Environment {
  const env = new Environment(parent);

  env.declare('null', MAKE_NULL(true));
  env.declare('true', MAKE_BOOL(true, true));
  env.declare('false', MAKE_BOOL(false, true));

  env.declare('printf', MAKE_NATIVE_METHOD((_, ...args) => {
    native.printf(args.shift() ?? MAKE_NULL(), ...args);
    return MAKE_NULL();
  }, true));

  env.declare('print', MAKE_NATIVE_METHOD((_, ...args) => {
    if(args.length > 1) {
      throw new Exception('print() takes only one argument');
    }

    native.print(args.shift() ?? MAKE_NULL());
    return MAKE_NULL();
  }, true), true);

  env.declare('math', {
    type: 'object',
    readonly: true,
    properties: new Map<string, RuntimeValue>(),
  } as ObjectValue, true);

  return env;
}

export class Environment {
  private readonly _vars: Map<string, RuntimeValue> = new Map<string, RuntimeValue>();

  constructor(
    protected readonly _parent?: Environment // eslint-disable-line comma-dangle
  ) { }

  public declare(name: string, value: RuntimeValue, readonly?: boolean): RuntimeValue {
    if(this._vars.has(name)) {
      throw new Exception(`Cannot redeclare variable '${name}' because it is already declared in this scope`);
    }

    if(typeof value.readonly !== 'boolean' &&
      typeof readonly === 'boolean') {
      Object.assign(value, { readonly });
    }

    this._vars.set(name, value);
    return value;
  }

  public resolve(name: string, error?: string): Environment {
    if(this._vars.has(name)) return this;

    if(!this._parent) {
      throw new Exception(error ?? `Undefined variable '${name}'`);
    }

    return this._parent.resolve(name);
  }

  public assign(name: string, value: RuntimeValue): RuntimeValue {
    const env = this.resolve(name, `Cannot assing to undefined variable '${name}'`);
    const v = env._vars.get(name)!;

    if(v.readonly) {
      throw new Exception(`Cannot assign constant variable '${name}'`);
    }

    env._vars.set(name, value);
    return value;
  }

  public lookup(name: string): RuntimeValue {
    const env = this.resolve(name);
    return env._vars.get(name) as RuntimeValue;
  }
}

export default Environment;
