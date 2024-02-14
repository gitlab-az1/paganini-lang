import { Lexer, Token, TokenType } from './lexer';
import { ParserError, UnexpectedTokenError } from '../_internals/errors';

import {
  BinaryExpression,
  DecimalLiteral,
  Expression,
  Identifier,
  IntegerLiteral,
  Program,
  Statement,
} from './ast';


export class Parser {
  private readonly _tokens: readonly Token[] = [];
  private _token: Token;
  private _position: number;

  constructor(source: string) {
    const tokenizer = new Lexer(source);
    this._tokens = Object.freeze(tokenizer.tokenize());

    this._position = 0;
    this._token = this._tokens[this._position];
  }

  private _eof(): boolean {
    return this._token.type === TokenType.EOF;
  }

  private _next(): void {
    this._position++;

    if(this._position > this._tokens.length - 1) return;
    this._token = this._tokens[this._position];
  }

  private _eat(): Token {
    const t = this._token;
    this._next();

    return t;
  }

  private _expect(type: TokenType, message: string): void {
    if(!this._token ||
        this._token.type !== type) {
      throw new ParserError(message, this._token);
    }

    this._next();
  }

  public parse(): Program {
    const p: Program = {
      body: [],
      kind: 'Program',
    };

    while(!this._eof()) {
      p.body.push(this._parseStatement());
    }

    return p;
  }

  private _parseStatement(): Statement {
    return this._parseExpression();
  }

  private _parseExpression(): Expression {
    return this._parseAdditiveExpression();
    return this._parseMultiplicativeExpression();
  }

  private _parseAdditiveExpression(): Expression {
    let l = this._parseMultiplicativeExpression();

    while(this._token.value === '+' || this._token.value === '-') {
      const o = this._eat().value;
      const r = this._parseMultiplicativeExpression();

      l = {
        kind: 'BinaryExpression',
        left: l,
        operator: o,
        right: r,
      } as BinaryExpression;
    }

    return l;
  }

  private _parseMultiplicativeExpression(): Expression {
    let l = this._parsePrimaryExpression();

    while(['*', '/', '%'].includes(this._token.value)) {
      const o = this._eat().value;
      const r = this._parsePrimaryExpression();

      l = {
        kind: 'BinaryExpression',
        left: l,
        operator: o,
        right: r,
      } as BinaryExpression;
    }

    return l;
  }

  private _parsePrimaryExpression(): Expression {
    switch(this._token.type) {
      case TokenType.Identifier:
        return {
          kind: 'Identifier',
          symbol: this._eat().value,
        } as Identifier;
      case TokenType.Integer:
        return {
          kind: 'IntegerLiteral',
          value: parseInt(this._eat().value),
        } as IntegerLiteral;
      case TokenType.Decimal:
        return {
          kind: 'DecimalLiteral',
          value: parseFloat(this._eat().value),
        } as DecimalLiteral;
      case TokenType.OpenParen: {
        this._eat();
        const e = this._parseExpression();
        
        this._expect(
          TokenType.CloseParen,
          'Unexpected token found inside parenthesied expression. Expected a closing parenthesis' // eslint-disable-line comma-dangle
        );

        return e;
      }
      case TokenType.Null:
        this._eat();
        
        return {
          kind: 'NullLiteral',
          value: 'null',
        } as Expression;
      default:
        throw new UnexpectedTokenError(
          this._token.type,
          this._token.value,
          this._token.locationInSource // eslint-disable-line comma-dangle
        );
    }
  }
}

export default Parser;
