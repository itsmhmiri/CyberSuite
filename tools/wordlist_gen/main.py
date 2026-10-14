#!/usr/bin/env python3
"""
WordListGen - Targeted OSINT Password & Wordlist Generator
Author: itsmhmiri (https://github.com/itsmhmiri/wordlist-gen)
"""

import argparse
import itertools
import json
import math
import sys
import time

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
MAGENTA = "\033[35m"
BLUE = "\033[34m"
DIM = "\033[2m"

SEASONS = ["Spring", "Summer", "Autumn", "Fall", "Winter"]
COMMON_SUFFIXES = ["!", "@", "#", "$", "123", "!", "2024", "2025", "2026", "!!", "???", "123!"]
LEET_MAP = {
    'a': ['a', '@', '4'],
    'e': ['e', '3'],
    'i': ['i', '1', '!'],
    'o': ['o', '0'],
    's': ['s', '$', '5'],
    't': ['t', '7'],
    'b': ['b', '8']
}

def calculate_entropy(password):
    pool = 0
    if any(c.islower() for c in password): pool += 26
    if any(c.isupper() for c in password): pool += 26
    if any(c.isdigit() for c in password): pool += 10
    if any(not c.isalnum() for c in password): pool += 32
    if pool == 0: return 0
    return round(len(password) * math.log2(pool), 1)

def parse_years(years_str):
    years = []
    if not years_str:
        return [str(y) for y in range(2022, 2027)]
    for part in years_str.split(','):
        part = part.strip()
        if '-' in part:
            try:
                start, end = part.split('-')
                years.extend([str(y) for y in range(int(start), int(end) + 1)])
            except ValueError:
                continue
        elif part.isdigit():
            years.append(part)
    return sorted(list(set(years)))

def generate_leet_variants(word, max_variants=6):
    variants = {word}
    lower = word.lower()
    
    # Simple substitution passes
    v1 = "".join(LEET_MAP.get(c, [c])[1] if c in LEET_MAP and len(LEET_MAP[c]) > 1 else c for c in lower)
    v2 = v1.capitalize()
    variants.add(v1)
    variants.add(v2)
    
    # Specific common replacements
    variants.add(lower.replace('a', '@').replace('e', '3'))
    variants.add(lower.replace('o', '0').replace('s', '$'))
    variants.add(lower.capitalize().replace('a', '@').replace('s', '$'))
    
    return [v for v in variants if v != word][:max_variants]

def main():
    parser = argparse.ArgumentParser(description="Targeted OSINT Wordlist Generator")
    parser.add_argument("--names", "-n", required=True, help="Target names / usernames (comma separated)")
    parser.add_argument("--company", "-c", default="", help="Target company or organization")
    parser.add_argument("--keywords", "-k", default="", help="Target keywords (pets, hobbies, cities)")
    parser.add_argument("--years", "-y", default="2022-2026", help="Years range or list (e.g. 2022-2026)")
    parser.add_argument("--seasons", action="store_true", default=False, help="Include seasons")
    parser.add_argument("--leet", action="store_true", default=False, help="Apply leetspeak rules")
    parser.add_argument("--specials", action="store_true", default=False, help="Append special characters")
    parser.add_argument("--min-len", type=int, default=8, help="Minimum password length")
    parser.add_argument("--max-len", type=int, default=18, help="Maximum password length")
    parser.add_argument("--output", "-o", default="", help="Output file path (optional)")
    parser.add_argument("--format", default="text", choices=["text", "json"], help="Output format")

    args = parser.parse_args()

    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print(f"{CYAN}{BOLD}           WordListGen v1.4.0 - OSINT Targeted Dictionary        {RESET}")
    print(f"{CYAN}{BOLD}           Author: itsmhmiri | https://github.com/itsmhmiri     {RESET}")
    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print()

    # Collect seeds
    seeds = [name.strip() for name in args.names.split(',') if name.strip()]
    if args.company:
        seeds.extend([c.strip() for c in args.company.split(',') if c.strip()])
    if args.keywords:
        seeds.extend([k.strip() for k in args.keywords.split(',') if k.strip()])
    if args.seasons:
        seeds.extend(SEASONS)

    years = parse_years(args.years)
    special_chars = ["!", "@", "#", "$", "%", "*", "?", "123", "!1", "123!"] if args.specials else [""]

    print(f"{BLUE}[*]{RESET} Collected {BOLD}{len(seeds)}{RESET} base seed tokens: {', '.join(seeds[:6])}{'...' if len(seeds) > 6 else ''}")
    print(f"{BLUE}[*]{RESET} Target years: {', '.join(years)}")
    print(f"{BLUE}[*]{RESET} Length bounds: [{args.min_len} .. {args.max_len}] characters")
    print(f"{BLUE}[*]{RESET} Leetspeak substitution: {'Enabled' if args.leet else 'Disabled'}")
    print()

    generated = set()
    start_time = time.time()

    # Expand seeds with casing
    cased_seeds = set()
    for s in seeds:
        cased_seeds.add(s)
        cased_seeds.add(s.lower())
        cased_seeds.add(s.upper())
        cased_seeds.add(s.capitalize())
        if args.leet:
            cased_seeds.update(generate_leet_variants(s))

    # Permutations & Combinations
    for base in cased_seeds:
        # 1. Base + Year
        for y in years:
            p1 = f"{base}{y}"
            if args.min_len <= len(p1) <= args.max_len:
                generated.add(p1)
            
            # Base + Year + Special
            for sc in special_chars:
                p2 = f"{base}{y}{sc}"
                if args.min_len <= len(p2) <= args.max_len:
                    generated.add(p2)
                p3 = f"{base}{sc}{y}"
                if args.min_len <= len(p3) <= args.max_len:
                    generated.add(p3)

        # 2. Base + Special
        for sc in special_chars:
            if sc:
                p4 = f"{base}{sc}"
                if args.min_len <= len(p4) <= args.max_len:
                    generated.add(p4)

        # 3. Two seeds combined (e.g. JohnAcme2024!)
        for other in seeds:
            if other.lower() != base.lower():
                combo = f"{base.capitalize()}{other.capitalize()}"
                if args.min_len <= len(combo) <= args.max_len:
                    generated.add(combo)
                for y in years[-2:]:
                    combo_y = f"{combo}{y}!"
                    if args.min_len <= len(combo_y) <= args.max_len:
                        generated.add(combo_y)

    results = sorted(list(generated))
    elapsed = round(time.time() - start_time, 3)

    print(f"{GREEN}[+]{RESET} Generation complete! Created {BOLD}{len(results):,}{RESET} tailored passwords in {elapsed}s.")
    print()
    print(f"{MAGENTA}{BOLD}Sample Generated Passwords & Entropy:{RESET}")
    print(f"{DIM}{'-' * 55}{RESET}")
    print(f"{BOLD}{'Password Candidate':<32} {'Length':<8} {'Entropy (bits)':<12}{RESET}")
    print(f"{DIM}{'-' * 55}{RESET}")

    sample_items = results[:25]
    for p in sample_items:
        ent = calculate_entropy(p)
        color = GREEN if ent >= 50 else (YELLOW if ent >= 35 else RED if 'RED' in globals() else BLUE)
        print(f" {CYAN}{p:<31}{RESET} {len(p):<8} {color}{ent:<12}{RESET}")

    if len(results) > 25:
        print(f"{DIM}... and {len(results) - 25} more passwords ...{RESET}")
    print(f"{DIM}{'-' * 55}{RESET}")
    print()

    # Emit machine-readable findings block for the dashboard parser
    structured_findings = {
        "status": "success",
        "total_generated": len(results),
        "execution_time_seconds": elapsed,
        "sample_entries": [
            {"password": p, "length": len(p), "entropy": calculate_entropy(p)}
            for p in results[:50]
        ],
        "summary": f"Generated {len(results)} high-probability password variants targeting provided OSINT seeds."
    }
    
    print(f"{BOLD}[+] Structured Findings Summary:{RESET}")
    print("<<<CYBERSUITE_FINDINGS_JSON>>>")
    print(json.dumps(structured_findings))
    print("<<<END_CYBERSUITE_FINDINGS_JSON>>>")

if __name__ == "__main__":
    main()
