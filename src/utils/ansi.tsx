import React from 'react';

// Maps common ANSI escape codes to Tailwind CSS classes
const ANSI_COLOR_MAP: Record<string, string> = {
  '30': 'text-slate-500',
  '31': 'text-rose-400 font-medium',
  '32': 'text-emerald-400 font-medium',
  '33': 'text-amber-300 font-medium',
  '34': 'text-sky-400 font-medium',
  '35': 'text-purple-400 font-medium',
  '36': 'text-cyan-300 font-medium',
  '37': 'text-slate-200',
  '90': 'text-slate-500',
  '91': 'text-rose-300',
  '92': 'text-emerald-300',
  '93': 'text-amber-200',
  '94': 'text-sky-300',
  '95': 'text-purple-300',
  '96': 'text-cyan-200',
  '97': 'text-white',
  '1': 'font-bold',
  '2': 'text-slate-500 opacity-80',
  '4': 'underline',
};

export function renderAnsiText(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex to split text by ANSI escape codes
  // Matches \x1b[...m
  const regex = /\x1b\[([0-9;]*)m/g;
  const elements: React.ReactNode[] = [];

  let lastIndex = 0;
  let currentClasses: string[] = [];
  let match: RegExpExecArray | null;

  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const rawCode = match[1] || match[2] || '0';
    const precedingText = text.substring(lastIndex, match.index);

    if (precedingText) {
      elements.push(
        <span
          key={`ansi_${keyIndex++}`}
          className={currentClasses.join(' ') || undefined}
        >
          {precedingText}
        </span>
      );
    }

    // Process escape codes
    const codes = rawCode.split(';');
    for (const code of codes) {
      if (code === '0' || code === '') {
        currentClasses = []; // reset
      } else if (ANSI_COLOR_MAP[code]) {
        currentClasses.push(ANSI_COLOR_MAP[code]);
      }
    }

    lastIndex = regex.lastIndex;
  }

  // Trailing text
  const trailingText = text.substring(lastIndex);
  if (trailingText) {
    elements.push(
      <span
        key={`ansi_${keyIndex++}`}
        className={currentClasses.join(' ') || undefined}
      >
        {trailingText}
      </span>
    );
  }

  return elements;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
