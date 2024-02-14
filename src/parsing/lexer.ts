import type { ReadonlyDict } from '../_internals/types';
import { UnrecognizedTokenError } from '../_internals/errors';


export const enum TokenType {
  Integer,
  Decimal,
  String,
  Identifier,
  Equals,
  OpenParen,
  CloseParen,
  OpenBrace,
  CloseBrace,
  BinaryOperator,
  
  // Keywords
  Let,
  Const,
  Symbol,
  If,
  Then,
  Else,
  While,
  For,
  Do,
  Func,
  Null,

  // Control 
  SemiColon,
  EOF,
}


const basicMathOperators: readonly string[] = [
  '+', '-', '*', '/', '%',
];

const ignorables: readonly string[] = [
  ' ', '\n', '\t',
];

const controlCharacters: readonly string[] = [
  ';',
];

const keywords: ReadonlyDict<TokenType> = {
  let: TokenType.Let,
  cosnt: TokenType.Const,
  symbol: TokenType.Symbol,
  if: TokenType.If,
  then: TokenType.Then,
  else: TokenType.Else,
  while: TokenType.While,
  for: TokenType.For,
  do: TokenType.Do,
  func: TokenType.Func,
  null: TokenType.Null,
};

const controls: ReadonlyDict<TokenType> = {
  ';': TokenType.SemiColon,
};


export interface Token {
  readonly value: string;
  readonly type: TokenType;
  readonly locationInSource: {
    readonly line: number;
    readonly column: number;
    readonly position: number;
    readonly filename?: string;
  }
}


function _isAlpha(s: string): boolean {
  return s.toUpperCase() !== s.toLowerCase();
}

function _isInt(s: string): boolean {
  const c = s.charCodeAt(0);

  const bounds = [
    '0'.charCodeAt(0), // 0x30
    '9'.charCodeAt(0), // 0x39
  ];

  return (c >= bounds[0] && c <= bounds[1]);
}

function _isFloat(s: string): boolean {
  if(_isAlpha(s)) return false;
  if(!/^[0-9]*\.?[0-9]*$/.test(s)) return false;

  return true;
}


export type SourceProps = {
  filename?: string;
}

export class Lexer {
  private _position: number = 0;
  private _line: number = 1;
  private _column: number = 1;
  private _char: string | null = null;
  private _characters: string[];

  constructor(
    private readonly _source: string,
    private readonly _props?: SourceProps // eslint-disable-line comma-dangle
  ) {
    this._characters = _source.split('');
    this._position = 0;
    this._char = this._characters[this._position];
  }

  public get source(): string {
    return this._source;
  }

  public tokenize(): Token[] {
    const tokens = [] as Token[];

    while(this._char != null && this._position < this._characters.length) {
      if(this._char === '(') {
        tokens.push({
          type: TokenType.OpenParen,
          value: this._char,
          locationInSource: {
            column: this._column,
            line: this._line,
            position: this._position,
            filename: this._props?.filename,
          },
        });

        this._next();
      } else if(this._char === ')') {
        tokens.push({
          type: TokenType.CloseParen,
          value: this._char,
          locationInSource: {
            column: this._column,
            line: this._line,
            position: this._position,
            filename: this._props?.filename,
          },
        });

        this._next();
      } else if(basicMathOperators.includes(this._char)) {
        tokens.push({
          type: TokenType.BinaryOperator,
          value: this._char,
          locationInSource: {
            column: this._column,
            line: this._line,
            position: this._position,
            filename: this._props?.filename,
          },
        });

        this._next();
      } else if(this._char === '=') {
        tokens.push({
          type: TokenType.Equals,
          value: this._char,
          locationInSource: {
            column: this._column,
            line: this._line,
            position: this._position,
            filename: this._props?.filename,
          },
        });

        this._next();
      } else if(controlCharacters.includes(this._char)) {
        const type = controls[this._char];

        if(!type) {
          throw new UnrecognizedTokenError(this._char, {
            line: this._line,
            column: this._column,
            filename: this._props?.filename,
            position: this._position,
          });
        }

        tokens.push({
          type,
          value: this._char,
          locationInSource: {
            column: this._column,
            line: this._line,
            position: this._position,
            filename: this._props?.filename,
          },
        });

        this._next();
      } else {
        if(_isFloat(this._char)) {
          let n = '';

          // Keep consuming characters until it's not a digit or a dot
          while (this._char !== null && (/^\d$/.test(this._char) || this._char === '.')) {
            n += this._char;
            this._next();
          }
          
          tokens.push({
            type: TokenType.Decimal,
            value: n,
            locationInSource: {
              column: this._column,
              line: this._line,
              position: this._position,
              filename: this._props?.filename,
            },
          });
        } else if(_isInt(this._char)) {
          let n = '';

          while(this._char !== null && _isInt(this._char)) {
            n += this._char;
            this._next();
          }

          tokens.push({
            type: TokenType.Integer,
            value: n,
            locationInSource: {
              column: this._column,
              line: this._line,
              position: this._position,
              filename: this._props?.filename,
            },
          });
        } else if(_isAlpha(this._char)) {
          let ident = '';

          while(this._char !== null && _isAlpha(this._char)) {
            ident += this._char;
            this._next();
          }

          const reserved = keywords[ident];

          if(!reserved) {
            tokens.push({
              type: TokenType.Identifier,
              value: ident,
              locationInSource: {
                column: this._column,
                line: this._line,
                position: this._position,
                filename: this._props?.filename,
              },
            });
          } else {
            tokens.push({
              type: reserved,
              value: ident,
              locationInSource: {
                column: this._column,
                line: this._line,
                position: this._position,
                filename: this._props?.filename,
              },
            });
          }
        } else if(this._char === '"') {
          let str = '';
          this._next();
    
          while(this._char !== null && this._char !== '"') {
            str += this._char;
            this._next();
          }
    
          this._next();
    
          tokens.push({
            type: TokenType.String,
            value: str,
            locationInSource: {
              column: this._column,
              line: this._line,
              position: this._position,
              filename: this._props?.filename,
            },
          });
        } else if(ignorables.includes(this._char)) {
          if(this._char === '\n') {
            this._line++;
            this._column = 1;
          } else if(this._char === '\t') {
            this._column += 4;
          } else if(this._char === ' ') {
            this._column++;
          }

          this._next();
        } else {
          throw new UnrecognizedTokenError(this._char, {
            line: this._line,
            column: this._column,
            filename: this._props?.filename,
            position: this._position,
          });
        }
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: 'EOF',
      locationInSource: {
        column: this._column,
        line: this._line,
        position: this._position,
        filename: this._props?.filename,
      },
    });

    return tokens;
  }

  private _next(): void {
    this._position++;

    if(this._position < this._characters.length) {
      this._char = this._characters[this._position] ?? null;
    } else {
      this._char = null;
    }
  }
}

export default Lexer;
