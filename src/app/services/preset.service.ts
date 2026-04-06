import { Injectable } from '@angular/core';
import { RegexPreset } from '../models/preset.model';

@Injectable({ providedIn: 'root' })
export class PresetService {
  readonly presets: RegexPreset[] = [
    {
      id: 'email',
      name: 'Email',
      regex: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
      flags: 'g',
      example: 'Contact us at hello@example.com or support@test.org for help.',
      description: 'Matches standard email format.',
      category: 'Communication',
    },
    {
      id: 'url',
      name: 'URL',
      regex: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-.,@?^=%&:/~+#]*[\\w\\-@?^=%&/~+#])?',
      flags: 'g',
      example: 'Visit https://www.example.com or http://docs.site.io/guide for more.',
      description: 'Matches http and https URLs.',
      category: 'Web',
    },
    {
      id: 'phone-us',
      name: 'Phone Number (US)',
      regex: '\\(?\\d{3}\\)?[\\s.\\-]?\\d{3}[\\s.\\-]?\\d{4}',
      flags: 'g',
      example: 'Call (555) 867-5309 or 800.555.1234 or 9175550100.',
      description: 'Matches common US phone number formats.',
      category: 'Communication',
    },
    {
      id: 'numbers-only',
      name: 'Numbers Only',
      regex: '\\d+',
      flags: 'g',
      example: 'There are 42 apples and 100 oranges in 3 baskets.',
      description: 'Matches one or more digits.',
      category: 'General',
    },
    {
      id: 'alphabets-only',
      name: 'Alphabets Only',
      regex: '[a-zA-Z]+',
      flags: 'g',
      example: 'Hello World 123 foo BAR',
      description: 'Matches sequences of letters only.',
      category: 'General',
    },
    {
      id: 'username',
      name: 'Username',
      regex: '[a-zA-Z0-9_]{3,16}',
      flags: 'g',
      example: 'Valid: john_doe, User123, abc. Invalid: ab, this-is-not, toolongusernamethatfails',
      description: 'Matches usernames: 3–16 alphanumeric chars or underscores.',
      category: 'Auth',
    },
    {
      id: 'password',
      name: 'Password (Strong)',
      regex: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}',
      flags: '',
      example: 'P@ssw0rd',
      description: 'At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.',
      category: 'Auth',
    },
    {
      id: 'date-iso',
      name: 'Date (YYYY-MM-DD)',
      regex: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
      flags: 'g',
      example: 'Events on 2024-01-15, 2025-12-31, and invalid 2024-13-01.',
      description: 'Matches ISO 8601 date format.',
      category: 'Date & Time',
    },
    {
      id: 'time',
      name: 'Time (HH:MM)',
      regex: '([01]\\d|2[0-3]):[0-5]\\d',
      flags: 'g',
      example: 'Meeting at 09:30 and 14:45, not at 25:00.',
      description: 'Matches 24-hour time format HH:MM.',
      category: 'Date & Time',
    },
    {
      id: 'ipv4',
      name: 'IPv4 Address',
      regex: '(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)',
      flags: 'g',
      example: 'Server at 192.168.1.1 and gateway 10.0.0.1. Invalid: 999.0.0.1',
      description: 'Matches valid IPv4 addresses.',
      category: 'Network',
    },
    {
      id: 'hex-color',
      name: 'Hex Color',
      regex: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})',
      flags: 'g',
      example: 'Colors: #FF5733, #abc, #000000, not #GGG or #12345.',
      description: 'Matches 3 or 6 digit hex color codes.',
      category: 'Design',
    },
    {
      id: 'zip-code',
      name: 'ZIP Code (US)',
      regex: '\\b\\d{5}(?:-\\d{4})?\\b',
      flags: 'g',
      example: 'Ship to 10001 or 90210-1234.',
      description: 'Matches 5-digit or ZIP+4 US postal codes.',
      category: 'Address',
    },
    {
      id: 'credit-card',
      name: 'Credit Card Number',
      regex: '\\b(?:\\d[ -]?){13,16}\\b',
      flags: 'g',
      example: 'Card: 4111 1111 1111 1111 or 5500-0000-0000-0004',
      description: 'Matches 13–16 digit card numbers with optional spaces or dashes.',
      category: 'Finance',
    },
    {
      id: 'hashtag',
      name: 'Hashtag',
      regex: '#[a-zA-Z]\\w*',
      flags: 'g',
      example: 'Trending: #Angular #WebDev #coding101 not #123bad',
      description: 'Matches social media hashtags starting with a letter.',
      category: 'Social',
    },
    {
      id: 'whitespace',
      name: 'Extra Whitespace',
      regex: '\\s{2,}',
      flags: 'g',
      example: 'This  has   extra    spaces between words.',
      description: 'Matches runs of 2 or more whitespace characters.',
      category: 'Text',
    },
  ];

  getAll(): RegexPreset[] {
    return this.presets;
  }

  search(query: string): RegexPreset[] {
    const q = query.toLowerCase();
    return this.presets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  getById(id: string): RegexPreset | undefined {
    return this.presets.find((p) => p.id === id);
  }
}
