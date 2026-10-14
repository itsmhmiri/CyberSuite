#!/usr/bin/env python3
"""
QuickBuster - High-Speed Async HTTP Directory & Endpoint Discovery
Author: itsmhmiri (https://github.com/itsmhmiri/quickbuster)
"""

import argparse
import asyncio
import json
import os
import random
import string
import sys
import time
import urllib.parse
import urllib.request
import ssl

# ANSI Colors
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
BLUE = "\033[34m"
DIM = "\033[2m"
MAGENTA = "\033[35m"

# Disable SSL verification warnings for testing
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def format_status(code):
    if 200 <= code < 300:
        return f"{GREEN}{BOLD}[{code}]{RESET}"
    elif 300 <= code < 400:
        return f"{BLUE}{BOLD}[{code}]{RESET}"
    elif code in (401, 403):
        return f"{YELLOW}{BOLD}[{code}]{RESET}"
    elif code == 404:
        return f"{DIM}[{code}]{RESET}"
    elif code >= 500:
        return f"{RED}{BOLD}[{code}]{RESET}"
    return f"[{code}]"

def probe_sync(url, timeout=5):
    """Synchronous probe run in thread executor to leverage urllib without third-party deps."""
    headers = {
        "User-Agent": "QuickBuster/1.2 (Security Audit Console; itsmhmiri)",
        "Accept": "*/*"
    }
    req = urllib.request.Request(url, headers=headers, method="GET")
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            content = resp.read()
            latency = round((time.time() - start) * 1000, 1)
            return {
                "status": resp.status,
                "size": len(content),
                "url": url,
                "latency_ms": latency,
                "location": resp.headers.get("Location", "")
            }
    except urllib.error.HTTPError as e:
        latency = round((time.time() - start) * 1000, 1)
        try:
            content_len = len(e.read())
        except Exception:
            content_len = 0
        return {
            "status": e.code,
            "size": content_len,
            "url": url,
            "latency_ms": latency,
            "location": e.headers.get("Location", "") if hasattr(e, "headers") else ""
        }
    except Exception as e:
        return {
            "error": str(e),
            "url": url,
            "status": None
        }

async def calibrate_404(loop, base_url, timeout):
    """Detect wildcard or custom 404 response sizes and codes."""
    print(f"{BLUE}[*]{RESET} Calibrating 404 response profile...")
    random_paths = [
        "".join(random.choices(string.ascii_lowercase + string.digits, k=16))
        for _ in range(3)
    ]
    sizes = []
    codes = []
    for p in random_paths:
        test_url = urllib.parse.urljoin(base_url, p)
        res = await loop.run_in_executor(None, probe_sync, test_url, timeout)
        if res.get("status"):
            codes.append(res["status"])
            sizes.append(res["size"])

    wildcard_code = codes[0] if codes and all(c == codes[0] for c in codes) else 404
    wildcard_size = sizes[0] if sizes and all(abs(s - sizes[0]) < 20 for s in sizes) else None
    
    if wildcard_code != 404:
        print(f"{YELLOW}[!]{RESET} Warning: Target returned HTTP {wildcard_code} for non-existent paths!")
    if wildcard_size is not None:
        print(f"{BLUE}[*]{RESET} Wildcard response baseline size: {wildcard_size} bytes (filtering auto-matches)")
    else:
        print(f"{GREEN}[+]{RESET} Standard 404 handling confirmed on target.")
    return wildcard_code, wildcard_size

async def main_async(args):
    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print(f"{CYAN}{BOLD}           QuickBuster v1.2.0 - Fast HTTP Directory Fuzzer       {RESET}")
    print(f"{CYAN}{BOLD}           Author: itsmhmiri | https://github.com/itsmhmiri     {RESET}")
    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print()

    base_url = args.url if args.url.endswith('/') else args.url + '/'
    valid_codes = [int(c.strip()) for c in args.status_codes.split(',') if c.strip().isdigit()]

    # Load wordlist
    wordlist_path = args.wordlist
    if not os.path.exists(wordlist_path):
        # Fallback to local search
        alt_path = os.path.join(os.getcwd(), wordlist_path)
        if os.path.exists(alt_path):
            wordlist_path = alt_path
        else:
            print(f"{RED}[-] Error: Wordlist file '{args.wordlist}' not found!{RESET}")
            sys.exit(1)

    with open(wordlist_path, 'r', encoding='utf-8', errors='ignore') as f:
        raw_words = [line.strip().lstrip('/') for line in f if line.strip() and not line.startswith('#')]

    # Expand extensions if specified
    extensions = [e.strip().lstrip('.') for e in args.extensions.split(',') if e.strip()] if args.extensions else []
    probe_targets = []
    for w in raw_words:
        probe_targets.append(w)
        for ext in extensions:
            probe_targets.append(f"{w}.{ext}")

    print(f"{BLUE}[*]{RESET} Target URL: {BOLD}{base_url}{RESET}")
    print(f"{BLUE}[*]{RESET} Wordlist: {wordlist_path} ({len(raw_words)} entries -> {len(probe_targets)} probes)")
    print(f"{BLUE}[*]{RESET} Concurrency: {args.concurrency} async workers | Timeout: {args.timeout}s")
    print(f"{BLUE}[*]{RESET} Match codes: {', '.join(map(str, valid_codes))}")
    print()

    loop = asyncio.get_running_loop()
    wildcard_code, wildcard_size = None, None
    if args.calibrate:
        wildcard_code, wildcard_size = await calibrate_404(loop, base_url, args.timeout)
        print()

    print(f"{BOLD}{'Status':<16} {'Path / Endpoint':<38} {'Size':<14} {'Latency':<10}{RESET}")
    print(f"{DIM}{'-' * 80}{RESET}")

    semaphore = asyncio.Semaphore(args.concurrency)
    discovered = []
    start_time = time.time()
    counter = 0

    async def worker(path):
        nonlocal counter
        async with semaphore:
            target_url = urllib.parse.urljoin(base_url, path)
            res = await loop.run_in_executor(None, probe_sync, target_url, args.timeout)
            counter += 1
            
            status = res.get("status")
            if status is not None and status in valid_codes:
                size = res.get("size", 0)
                # Check against wildcard baseline
                if wildcard_size is not None and status == wildcard_code and abs(size - wildcard_size) < 15:
                    return None
                
                latency = res.get("latency_ms", 0)
                loc = f" -> {res['location']}" if res.get("location") else ""
                disp_path = f"/{path}{loc}"
                if len(disp_path) > 36:
                    disp_path = disp_path[:33] + "..."
                
                print(f"{format_status(status):<16} {disp_path:<38} {f'{size} B':<14} {f'{latency}ms':<10}")
                item = {
                    "path": f"/{path}",
                    "url": target_url,
                    "status": status,
                    "size_bytes": size,
                    "latency_ms": latency,
                    "redirect_location": res.get("location", "")
                }
                discovered.append(item)
                return item
            return None

    tasks = [worker(path) for path in probe_targets]
    await asyncio.gather(*tasks)

    elapsed = round(time.time() - start_time, 2)
    print(f"{DIM}{'-' * 80}{RESET}")
    print(f"{GREEN}[+]{RESET} Scan completed in {elapsed}s. Probed {counter} endpoints, discovered {BOLD}{len(discovered)}{RESET} live routes.")
    print()

    # Emit structured findings JSON for the UI dashboard cards
    structured = {
        "status": "success",
        "target": base_url,
        "total_probed": counter,
        "endpoints_found": len(discovered),
        "execution_time_seconds": elapsed,
        "endpoints": sorted(discovered, key=lambda x: (x['status'], x['path'])),
        "summary": f"Discovered {len(discovered)} endpoints matching status filters [{args.status_codes}] on {base_url}."
    }

    print(f"{BOLD}[+] Structured Findings Summary:{RESET}")
    print("<<<CYBERSUITE_FINDINGS_JSON>>>")
    print(json.dumps(structured))
    print("<<<END_CYBERSUITE_FINDINGS_JSON>>>")

def main():
    parser = argparse.ArgumentParser(description="QuickBuster - HTTP Directory & Endpoint Discovery")
    parser.add_argument("-u", "--url", required=True, help="Target Base URL (e.g. https://httpbin.org)")
    parser.add_argument("-w", "--wordlist", default="wordlists/common_endpoints.txt", help="Path to wordlist")
    parser.add_argument("-c", "--concurrency", type=int, default=20, help="Concurrency limit")
    parser.add_argument("-t", "--timeout", type=int, default=5, help="Request timeout in seconds")
    parser.add_argument("--calibrate", action="store_true", default=False, help="Smart 404 calibration")
    parser.add_argument("-x", "--extensions", default="", help="Comma-separated extensions")
    parser.add_argument("-s", "--status-codes", default="200,204,301,302,307,401,403", help="Status codes to report")

    args = parser.parse_args()
    asyncio.run(main_async(args))

if __name__ == "__main__":
    main()
