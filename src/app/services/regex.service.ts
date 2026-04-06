import { Injectable } from '@angular/core';
import { MatchResult, RegexToken } from '../models/preset.model';

@Injectable({ providedIn: 'root' })
export class RegexService {
  summarize(pattern: string): { summary: string; examples: string[] } {
    if (!pattern) {
      return { summary: '', examples: [] };
    }

    const normalized = pattern.replace(/^\^/, '').replace(/\$$/, '');
    const isAnchored = pattern.startsWith('^') && pattern.endsWith('$');

    if (/^\\d\+$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a string containing only numbers',
        examples: ['123', '456'],
      };
    }

    if (/^\[a-zA-Z]\+$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a string containing only letters',
        examples: ['Hello', 'World'],
      };
    }

    if (/^\[a-z]\+$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a string containing only lowercase letters',
        examples: ['hello', 'world'],
      };
    }

    if (/^\[A-Z]\+$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a string containing only uppercase letters',
        examples: ['ABC', 'XYZ'],
      };
    }

    if (/^\\d\{4}-\\d\{2}-\\d\{2}$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a date formatted like YYYY-MM-DD',
        examples: ['2025-01-01', '2024-12-31'],
      };
    }

    if (/^\\d\{3}-\\d\{2}-\\d\{4}$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a number formatted like XXX-XX-XXXX',
        examples: ['123-45-6789', '987-65-4321'],
      };
    }

    if (/^\\d\{10}$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches a 10-digit number',
        examples: ['9876543210', '1234567890'],
      };
    }

    if (/^\[\^\\s@]\+@\[\^\\s@]\+\\\.\[\^\\s@]\+$/.test(normalized) && isAnchored) {
      return {
        summary: 'Matches text that looks like an email address',
        examples: ['test@example.com', 'user@domain.com'],
      };
    }

    if (/^\\d\{\d+}-\\d\{\d+}-\\d\{\d+}$/.test(normalized) && isAnchored) {
      return {
        summary: `Matches a number formatted like ${this.toPlaceholderFormat(normalized)}`,
        examples: this.examplesForPlaceholder(this.toPlaceholderFormat(normalized)),
      };
    }

    const simpleClass = this.describeSimpleContent(normalized);
    if (simpleClass && isAnchored) {
      return {
        summary: `Matches a string containing only ${simpleClass}`,
        examples: this.examplesForContent(simpleClass),
      };
    }

    if (simpleClass) {
      return {
        summary: `Matches ${simpleClass} within a larger string`,
        examples: this.examplesForContent(simpleClass),
      };
    }

    return {
      summary: 'This regex matches a specific pattern. Breakdown shown below.',
      examples: [],
    };
  }

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
      if (ch === '^') { consume('^', 'Start of string'); i++; continue; }
      if (ch === '$') { consume('$', 'End of string'); i++; continue; }

      // Escaped sequences
      if (ch === '\\' && i + 1 < pattern.length) {
        const next = pattern[i + 1];
        let base = '\\' + next;
        let quant = '';
        let exp = '';
        switch (next) {
          case 'd': exp = 'Matches a digit'; break;
          case 'D': exp = 'Matches any non-digit'; break;
          case 'w': exp = 'Matches a word character'; break;
          case 'W': exp = 'Matches any non-word character'; break;
          case 's': exp = 'Matches whitespace'; break;
          case 'S': exp = 'Matches any non-whitespace character'; break;
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
        let exp = cls.startsWith('[^') ? `Matches any character except ${cls.slice(2, -1)}` : `Matches one character from ${cls.slice(1, -1)}`;
        i = end + 1;
        const q = this.peekQuantifier(pattern, i);
        if (q) { exp += ' ' + q.desc; i += q.len; consume(cls + q.str, exp); } else { consume(cls, exp); }
        continue;
      }

      // Groups (...)
      if (ch === '(') {
        let label = 'Capturing group';
        let lookahead = '';
        if (pattern.slice(i + 1, i + 3) === '?:') { label = 'Starts a non-capturing group'; lookahead = '?:'; }
        else if (pattern.slice(i + 1, i + 3) === '?=') { label = 'Starts a positive lookahead'; lookahead = '?='; }
        else if (pattern.slice(i + 1, i + 3) === '?!') { label = 'Starts a negative lookahead'; lookahead = '?!'; }
        else if (pattern.slice(i + 1, i + 4) === '?<=') { label = 'Starts a positive lookbehind'; lookahead = '?<='; }
        else if (pattern.slice(i + 1, i + 4) === '?<!') { label = 'Starts a negative lookbehind'; lookahead = '?<!'; }
        else { label = 'Starts a capturing group'; }
        consume('(' + lookahead, label);
        i += 1 + lookahead.length;
        continue;
      }

      if (ch === ')') { consume(')', 'Ends the group'); i++; continue; }

      // Alternation
      if (ch === '|') { consume('|', 'OR — match left or right side'); i++; continue; }

      // Dot
      if (ch === '.') {
        let exp = 'Matches any character';
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
      let exp = `Matches the character "${ch}"`;
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
      return { str: lazy ? '*?' : '*', desc: lazy ? 'for 0 or more matches, as few as possible' : 'for 0 or more matches', len: lazy ? 2 : 1 };
    }
    if (ch === '+') {
      const lazy = pattern[i + 1] === '?';
      return { str: lazy ? '+?' : '+', desc: lazy ? 'for 1 or more matches, as few as possible' : 'for 1 or more matches', len: lazy ? 2 : 1 };
    }
    if (ch === '?') {
      return { str: '?', desc: 'optionally', len: 1 };
    }
    if (ch === '{') {
      const end = pattern.indexOf('}', i);
      if (end === -1) return null;
      const inner = pattern.slice(i + 1, end);
      const lazy = pattern[end + 1] === '?';
      const parts = inner.split(',');
      let desc = '';
      if (parts.length === 1) desc = `exactly ${inner} times`;
      else if (parts[1] === '') desc = `${parts[0]} or more times`;
      else desc = `between ${parts[0]} and ${parts[1]} times`;
      if (lazy) desc += ', as few as possible';
      const str = `{${inner}}${lazy ? '?' : ''}`;
      return { str, desc, len: end - i + 1 + (lazy ? 1 : 0) };
    }
    return null;
  }

  private describeSimpleContent(pattern: string): string | null {
    if (/^\\d([+*]|\{\d+(,\d*)?\})?$/.test(pattern)) return 'numbers';
    if (/^\[a-zA-Z]([+*]|\{\d+(,\d*)?\})?$/.test(pattern)) return 'letters';
    if (/^\[a-z]([+*]|\{\d+(,\d*)?\})?$/.test(pattern)) return 'lowercase letters';
    if (/^\[A-Z]([+*]|\{\d+(,\d*)?\})?$/.test(pattern)) return 'uppercase letters';
    return null;
  }

  private toPlaceholderFormat(pattern: string): string {
    return pattern
      .replace(/\\d\{(\d+)}/g, (_, count: string) => 'X'.repeat(Number(count)))
      .replace(/\\d/g, 'X');
  }

  private examplesForPlaceholder(placeholder: string): string[] {
    const sample = placeholder.replace(/X/g, '1');
    const alt = placeholder.replace(/X/g, '9');
    return [sample, alt];
  }

  private examplesForContent(content: string): string[] {
    switch (content) {
      case 'numbers':
        return ['123', '456'];
      case 'letters':
        return ['Hello', 'World'];
      case 'lowercase letters':
        return ['hello', 'world'];
      case 'uppercase letters':
        return ['ABC', 'XYZ'];
      default:
        return [];
    }
  }
}
