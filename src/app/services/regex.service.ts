import { Injectable } from '@angular/core';
import { MatchResult, RegexToken } from '../models/preset.model';

@Injectable({ providedIn: 'root' })
export class RegexService {
  buildRegex(pattern: string, flags: string): RegExp | null {
    if (!pattern) return null;
    try {
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }

  isValid(pattern: string, flags: string): boolean {
    return this.buildRegex(pattern, flags) !== null;
  }

  getMatches(pattern: string, flags: string, text: string): MatchResult[] {
    if (!pattern || !text) return this.toSegments(text, []);
    const regex = this.buildRegex(pattern, flags.includes('g') ? flags : flags + 'g');
    if (!regex) return this.toSegments(text, []);

    const spans: { start: number; end: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m[0].length === 0) { regex.lastIndex++; continue; }
      spans.push({ start: m.index, end: m.index + m[0].length });
    }
    return this.toSegments(text, spans);
  }

  countMatches(pattern: string, flags: string, text: string): number {
    if (!pattern || !text) return 0;
    const regex = this.buildRegex(pattern, flags.includes('g') ? flags : flags + 'g');
    if (!regex) return 0;
    return (text.match(regex) ?? []).length;
  }

  private toSegments(text: string, spans: { start: number; end: number }[]): MatchResult[] {
    const result: MatchResult[] = [];
    let cursor = 0;
    for (const span of spans) {
      if (cursor < span.start) {
        result.push({ text: text.slice(cursor, span.start), isMatch: false, index: cursor });
      }
      result.push({ text: text.slice(span.start, span.end), isMatch: true, index: span.start });
      cursor = span.end;
    }
    if (cursor < text.length) {
      result.push({ text: text.slice(cursor), isMatch: false, index: cursor });
    }
    return result;
  }

  explain(pattern: string): RegexToken[] {
    if (!pattern) return [];
    const tokens: RegexToken[] = [];
    let i = 0;

    const consume = (tok: string, exp: string) => {
      tokens.push({ token: tok, explanation: exp });
    };

    while (i < pattern.length) {
      const ch = pattern[i];

      // Anchors
      if (ch === '^') { consume('^', 'Start of string (or line with m flag)'); i++; continue; }
      if (ch === '$') { consume('$', 'End of string (or line with m flag)'); i++; continue; }

      // Escaped sequences
      if (ch === '\\' && i + 1 < pattern.length) {
        const next = pattern[i + 1];
        let base = '\\' + next;
        let quant = '';
        let exp = '';
        switch (next) {
          case 'd': exp = 'Any digit (0–9)'; break;
          case 'D': exp = 'Any non-digit'; break;
          case 'w': exp = 'Any word character (a–z, A–Z, 0–9, _)'; break;
          case 'W': exp = 'Any non-word character'; break;
          case 's': exp = 'Any whitespace (space, tab, newline)'; break;
          case 'S': exp = 'Any non-whitespace'; break;
          case 'b': exp = 'Word boundary'; break;
          case 'B': exp = 'Non-word boundary'; break;
          case 'n': exp = 'Newline character'; break;
          case 't': exp = 'Tab character'; break;
          case 'r': exp = 'Carriage return'; break;
          default: exp = `Escaped literal "${next}"`; break;
        }
        i += 2;
        // Check for quantifier
        const q = this.peekQuantifier(pattern, i);
        if (q) { quant = q.str; exp += ' ' + q.desc; i += q.len; }
        consume(base + quant, exp);
        continue;
      }

      // Character class [...]
      if (ch === '[') {
        let end = i + 1;
        if (pattern[end] === '^') end++;
        while (end < pattern.length && pattern[end] !== ']') {
          if (pattern[end] === '\\') end++;
          end++;
        }
        const cls = pattern.slice(i, end + 1);
        let exp = cls.startsWith('[^') ? `Any character NOT in [${cls.slice(2, -1)}]` : `Any character in [${cls.slice(1, -1)}]`;
        i = end + 1;
        const q = this.peekQuantifier(pattern, i);
        if (q) { exp += ' ' + q.desc; i += q.len; consume(cls + q.str, exp); } else { consume(cls, exp); }
        continue;
      }

      // Groups (...)
      if (ch === '(') {
        let label = 'Capturing group';
        let lookahead = '';
        if (pattern.slice(i + 1, i + 3) === '?:') { label = 'Non-capturing group'; lookahead = '?:'; }
        else if (pattern.slice(i + 1, i + 3) === '?=') { label = 'Positive lookahead'; lookahead = '?='; }
        else if (pattern.slice(i + 1, i + 4) === '?!') { label = 'Negative lookahead'; lookahead = '?!'; }
        else if (pattern.slice(i + 1, i + 4) === '?<=') { label = 'Positive lookbehind'; lookahead = '?<='; }
        else if (pattern.slice(i + 1, i + 5) === '?<!') { label = 'Negative lookbehind'; lookahead = '?<!'; }
        consume('(' + lookahead, label);
        i += 1 + lookahead.length;
        continue;
      }

      if (ch === ')') { consume(')', 'End of group'); i++; continue; }

      // Alternation
      if (ch === '|') { consume('|', 'OR — match left or right side'); i++; continue; }

      // Dot
      if (ch === '.') {
        let exp = 'Any character except newline';
        i++;
        const q = this.peekQuantifier(pattern, i);
        if (q) { exp += ' ' + q.desc; i += q.len; consume('.' + q.str, exp); } else { consume('.', exp); }
        continue;
      }

      // Lone quantifiers (shouldn't normally appear here but handle gracefully)
      if ('*+?{}'.includes(ch)) {
        const q = this.peekQuantifier(pattern, i);
        if (q) { consume(q.str, q.desc); i += q.len; continue; }
        consume(ch, 'Quantifier'); i++; continue;
      }

      // Literal character
      let exp = `Literal character "${ch}"`;
      i++;
      const q = this.peekQuantifier(pattern, i);
      if (q) { exp += ' ' + q.desc; i += q.len; consume(ch + q.str, exp); } else { consume(ch, exp); }
    }

    return tokens;
  }

  private peekQuantifier(pattern: string, i: number): { str: string; desc: string; len: number } | null {
    const ch = pattern[i];
    if (!ch) return null;

    if (ch === '*') {
      const lazy = pattern[i + 1] === '?';
      return { str: lazy ? '*?' : '*', desc: lazy ? '(0 or more, lazy)' : '(0 or more times)', len: lazy ? 2 : 1 };
    }
    if (ch === '+') {
      const lazy = pattern[i + 1] === '?';
      return { str: lazy ? '+?' : '+', desc: lazy ? '(1 or more, lazy)' : '(1 or more times)', len: lazy ? 2 : 1 };
    }
    if (ch === '?') {
      return { str: '?', desc: '(optional — 0 or 1 time)', len: 1 };
    }
    if (ch === '{') {
      const end = pattern.indexOf('}', i);
      if (end === -1) return null;
      const inner = pattern.slice(i + 1, end);
      const lazy = pattern[end + 1] === '?';
      const parts = inner.split(',');
      let desc = '';
      if (parts.length === 1) desc = `(exactly ${inner} times)`;
      else if (parts[1] === '') desc = `(${parts[0]} or more times)`;
      else desc = `(between ${parts[0]} and ${parts[1]} times)`;
      if (lazy) desc = desc.replace(')', ', lazy)');
      const str = `{${inner}}${lazy ? '?' : ''}`;
      return { str, desc, len: end - i + 1 + (lazy ? 1 : 0) };
    }
    return null;
  }
}
