import { Lexer, Token, TokenType } from './lexer';
import { ParserError, UnexpectedTokenError } from '../_internals/errors';

import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  DecimalLiteral,
  Expression,
  Identifier,
  IntegerLiteral,
  MemberExpression,
  ObjectLiteral,
  Program,
  Property,
  Statement,
  VariableDeclaration,
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

  private _expect(type: TokenType, message: string): Token {
    if(!this._token ||
        this._token.type !== type) {
      throw new ParserError(message, this._token);
    }

    return this._eat();
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
    switch(this._token.type) {
      case TokenType.Let:
        return this._parseDeclaration();
      case TokenType.Const:
        return this._parseDeclaration();
      default:
        return this._parseExpression();
    }
  }

  private _parseDeclaration(): Statement {
    const t = this._eat();
    const isConst = t.type === TokenType.Const;

    const id = this._expect(
      TokenType.Identifier,
      `Expected an identifier after the \`${isConst ? 'const' : 'let'}\` keyword` // eslint-disable-line comma-dangle
    );

    let o: VariableDeclaration | null = null;

    if(this._token.type === TokenType.SemiColon) {
      this._eat();

      if(isConst) {
        throw new ParserError(
          'Constant declaration must have an initial value',
          this._token // eslint-disable-line comma-dangle
        );
      }

      o = {
        kind: 'VariableDeclaration',
        constant: false,
        varname: id.value,
      };
    } else {
      this._expect(TokenType.Equals,
        'Expected an equals sign after the variable name');

      o = {
        constant: isConst,
        kind: 'VariableDeclaration',
        varname: id.value,
        value: this._parseExpression(),
      };

      this._expect(TokenType.SemiColon,
        'Expected a semicolon after the variable declaration');
    }

    return o as VariableDeclaration;
  }

  private _parseExpression(): Expression {
    return this._parseAssignmentExpression();
  }

  private _parseObjectExpression(): Expression {
    if(this._token.type !== TokenType.OpenBracket) return this._parseAdditiveExpression();

    this._eat();
    const props = [] as Property[];

    // @ts-expect-error Overloap for `this._token` is intentional because method "eat" is called after checking for the opening Bracket
    while(!this._eof() && this._token.type !== TokenType.CloseBracket) {
      const key = this._expect(TokenType.Identifier,
        'Object literal property must have a key').value;

      // @ts-expect-error Overloap for `this._token` is intentional because every while loop iteration calls method "eat"
      if(this._token.type === TokenType.Comma) {
        this._eat();
        
        props.push({
          key,
          kind: 'Property',
        });

        continue;
        // @ts-expect-error Overloap for `this._token` is intentional because every while loop iteration calls method "eat"
      } else if(this._token.type === TokenType.CloseBracket) {
        props.push({
          key,
          kind: 'Property',
        });

        continue;
      } else {
        this._expect(TokenType.Colon,
          'Missing colon after object literal property key');

        const value = this._parseExpression();

        props.push({
          key,
          value,
          kind: 'Property',
        });

        // @ts-expect-error Overloap for `this._token` is intentional because every while loop iteration calls method "eat"
        if(this._token.type !== TokenType.CloseBracket) {
          this._expect(TokenType.Comma,
            'Object literal properties must be separated by a comma');
        }
      }
    }

    this._expect(TokenType.CloseBracket,
      'Object literal must end with a closing Bracket');

    return {
      kind: 'ObjectLiteral',
      properties: props,
    } as ObjectLiteral;
  }

  private _parseAssignmentExpression(): Expression {
    const left = this._parseObjectExpression();
    let o: Expression = left;

    if(this._token.type === TokenType.Equals) {
      this._eat();
      
      o = {
        value: this._parseAssignmentExpression(),
        kind: 'AssignmentExpression',
        target: left,
      } as AssignmentExpression;
    }

    return o;
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
    let l = this._parseCallMemberExpression();

    while(['*', '**', '/', '%'].includes(this._token.value)) {
      const o = this._eat().value;
      const r = this._parseCallMemberExpression();

      l = {
        kind: 'BinaryExpression',
        left: l,
        operator: o,
        right: r,
      } as BinaryExpression;
    }

    return l;
  }

  private _parseCallMemberExpression(): Expression {
    const m = this._parseMemberExpression();

    if(this._token.type === TokenType.OpenParen) return this._parseCallExpression(m);
    return m;
  }

  private _parseMemberExpression(): Expression {
    let o = this._parsePrimaryExpression();

    while(this._token.type === TokenType.Dot ||
      this._token.type === TokenType.OpenBrace) {
      const operator = this._eat();
      let prop: Expression;
      let c: boolean;

      if(operator.type === TokenType.Dot) {
        c = false;
        prop = this._parsePrimaryExpression();

        if(prop.kind !== 'Identifier') {
          throw new ParserError(
            'Cannot use dot operator without a right-hand side identifier',
            operator // eslint-disable-line comma-dangle
          );
        }
      } else {
        c = true;
        prop = this._parseExpression();

        this._expect(TokenType.CloseBrace,
          'Expected a closing brace after the computed property name');
      }

      o = {
        kind: 'MemberExpression',
        object: o,
        computed: c,
        property: prop,
      } as MemberExpression;
    }

    return o;
  }

  private _parseCallExpression(callerArg: Expression): Expression {
    let e: Expression = {
      kind: 'CallExpression',
      caller: callerArg,
      arguments: this._parseArguments(),
    } as CallExpression;

    if(this._token.type === TokenType.OpenParen) {
      e = this._parseCallExpression(e);
    }

    return e;
  }

  private _parseArguments(): Expression[] {
    this._expect(TokenType.OpenParen,
      'Expected an opening parenthesis before the arguments list');

    const args: Expression[] = this._token.type === TokenType.CloseParen ?
      [] :
      this._parseArgumentsList();

    this._expect(TokenType.CloseParen,
      'Expected a closing parenthesis after the arguments list');

    return args;
  }

  private _parseArgumentsList(): Expression[] {
    const args = [this._parseAssignmentExpression()];

    while(this._token.type === TokenType.Comma && this._eat()) {
      args.push(this._parseAssignmentExpression());
    }

    return args;
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
