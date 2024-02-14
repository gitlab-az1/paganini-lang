import { Token } from '../parsing/lexer';
import type { Dict, SourceLocationPointer } from './types';


export class Exception extends Error {
  [key: string]: any;
  
  public readonly message: string;
  public readonly name: string;

  constructor(message?: string, contextObject?: Dict<unknown>) {
    super(message);
    
    this.message = message ?? '';
    this.name = 'Exception';

    if(typeof contextObject === 'object' && Object.keys(contextObject).length > 0) {
      for(const prop in contextObject) {
        if(['name', 'message', 'cause', 'stack'].includes(prop)) continue;
        (this as unknown as Dict<any>)[prop] = contextObject[prop];
      }
    }
  }
}


export class UnrecognizedTokenError extends Exception {
  public readonly name = 'UnrecognizedTokenError' as const;

  public readonly line?: number;
  public readonly column?: number;
  public readonly position?: number;
  public readonly filename?: string;
  public readonly token: string;

  constructor(token: string, location?: SourceLocationPointer) {
    let msg = `Unrecognized character found in source \`${token}\``;

    if(!!location && location.line && location.column) {
      msg += ` at line ${location.line}, column ${location.column}`;
    }

    super(msg);

    this.token = token;
    this.column = location?.column;
    this.line = location?.line;
    this.filename = location?.filename;
    this.position = location?.position;
  }
}

export class UnexpectedTokenError extends Exception {
  public readonly name = 'UnexpectedTokenError' as const;

  public readonly line?: number;
  public readonly column?: number;
  public readonly position?: number;
  public readonly filename?: string;
  public readonly token: string;

  constructor(tokenType: number, token: string, location?: SourceLocationPointer) {
    let msg = `Unexpected token (${tokenType}) \`${token}\``;

    if(!!location && location.line && location.column) {
      msg += ` at line ${location.line}, column ${location.column}`;
    }

    super(msg);

    this.token = token;
    this.column = location?.column;
    this.line = location?.line;
    this.filename = location?.filename;
    this.position = location?.position;
  }
}

export class ParserError extends Exception {
  constructor(message: string, token: Token, ctx?: Dict<any>) {
    super(`Parser error: ${message} for token in position ${token.locationInSource.position} (${token.type}, \`${token.value}\`) at line ${token.locationInSource.line}, column ${token.locationInSource.column}`,
      ctx);
  }
}
