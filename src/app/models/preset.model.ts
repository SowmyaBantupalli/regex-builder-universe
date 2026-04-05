export interface RegexPreset {
  id: string;
  name: string;
  regex: string;
  flags: string;
  example: string;
  description: string;
  category: string;
}

export interface RegexToken {
  token: string;
  explanation: string;
}

export interface MatchResult {
  text: string;
  isMatch: boolean;
  index: number;
}
