#!/usr/bin/env python3
"""
HTTP Security Headers & SSL Auditor
Evaluates OWASP recommended defense-in-depth HTTP headers and flags insecure configurations.
"""

import argparse
import json
import ssl
import sys
import time
import urllib.parse
import urllib.request

RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
BLUE = "\033[34m"
DIM = "\033[2m"

SECURITY_HEADERS = [
    {
        "name": "Strict-Transport-Security",
        "description": "Enforces HTTPS connections and guards against SSL stripping attacks",
        "weight": 25,
        "recommended": "max-age=31536000; includeSubDomains; preload"
    },
    {
        "name": "Content-Security-Policy",
        "description": "Mitigates Cross-Site Scripting (XSS) and data injection attacks",
        "weight": 25,
        "recommended": "default-src 'self'; script-src 'self' ..."
    },
    {
        "name": "X-Frame-Options",
        "description": "Prevents Clickjacking by controlling iframe embedding",
        "weight": 15,
        "recommended": "DENY or SAMEORIGIN"
    },
    {
        "name": "X-Content-Type-Options",
        "description": "Prevents MIME-sniffing attacks",
        "weight": 15,
        "recommended": "nosniff"
    },
    {
        "name": "Referrer-Policy",
        "description": "Controls how much referrer information is leaked on outbound navigation",
        "weight": 10,
        "recommended": "strict-origin-when-cross-origin"
    },
    {
        "name": "Permissions-Policy",
        "description": "Restricts browser features (camera, microphone, geolocation)",
        "weight": 10,
        "recommended": "camera=(), microphone=(), geolocation=()"
    }
]

DANGEROUS_HEADERS = ["Server", "X-Powered-By", "X-AspNet-Version", "X-Runtime"]

def main():
    parser = argparse.ArgumentParser(description="HTTP Security Headers & Posture Auditor")
    parser.add_argument("-u", "--url", required=True, help="Target URL to audit")
    parser.add_argument("--follow-redirects", action="store_true", default=True, help="Follow redirects")
    parser.add_argument("-t", "--timeout", type=int, default=8, help="Timeout in seconds")

    args = parser.parse_args()

    target_url = args.url if "://" in args.url else f"https://{args.url}"

    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print(f"{CYAN}{BOLD}          HTTP Security Headers & Web Posture Auditor            {RESET}")
    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print()
    print(f"{BLUE}[*]{RESET} Target URL: {BOLD}{target_url}{RESET}")
    print(f"{BLUE}[*]{RESET} Requesting response headers...")

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        target_url,
        headers={"User-Agent": "CyberSuite-Audit/1.0 (WebSec Prober)"},
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=args.timeout, context=ctx) as resp:
            headers = dict(resp.headers)
            status_code = resp.status
            final_url = resp.url
    except urllib.error.HTTPError as e:
        headers = dict(e.headers)
        status_code = e.code
        final_url = e.url
    except Exception as e:
        print(f"{RED}[-] Error connecting to target: {e}{RESET}")
        sys.exit(1)

    print(f"{GREEN}[+]{RESET} Received HTTP {status_code} from {final_url}")
    print()

    # Score headers
    score = 0
    findings = []
    
    print(f"{BOLD}{'Security Header':<28} {'Status':<12} {'Value / Assessment':<42}{RESET}")
    print(f"{DIM}{'-' * 82}{RESET}")

    for h in SECURITY_HEADERS:
        name = h["name"]
        header_val = None
        for k, v in headers.items():
            if k.lower() == name.lower():
                header_val = v
                break

        if header_val:
            score += h["weight"]
            val_disp = header_val[:40] + "..." if len(header_val) > 40 else header_val
            print(f"{GREEN}{name:<28}{RESET} {GREEN}PRESENT{RESET}     {CYAN}{val_disp}{RESET}")
            findings.append({
                "header": name,
                "status": "pass",
                "value": header_val,
                "weight": h["weight"],
                "description": h["description"]
            })
        else:
            print(f"{RED}{name:<28}{RESET} {RED}MISSING{RESET}     {DIM}Not implemented (OWASP risk){RESET}")
            findings.append({
                "header": name,
                "status": "missing",
                "value": None,
                "weight": h["weight"],
                "description": h["description"],
                "recommendation": f"Add '{name}: {h['recommended']}'"
            })

    print(f"{DIM}{'-' * 82}{RESET}")
    print()

    # Information Disclosure Check
    leaks = []
    for dh in DANGEROUS_HEADERS:
        for k, v in headers.items():
            if k.lower() == dh.lower():
                leaks.append((dh, v))
                score = max(0, score - 5)

    if leaks:
        print(f"{YELLOW}{BOLD}[!] Information Leakage Warnings:{RESET}")
        for l_name, l_val in leaks:
            print(f"  {YELLOW}-{RESET} {l_name}: {CYAN}{l_val}{RESET} (Technology stack disclosure)")
        print()

    # Calculate letter grade
    if score >= 90:
        grade = "A+"
        grade_color = GREEN
    elif score >= 80:
        grade = "A"
        grade_color = GREEN
    elif score >= 65:
        grade = "B"
        grade_color = BLUE
    elif score >= 50:
        grade = "C"
        grade_color = YELLOW
    elif score >= 35:
        grade = "D"
        grade_color = YELLOW
    else:
        grade = "F"
        grade_color = RED

    print(f"{BOLD}Security Posture Score:{RESET} {grade_color}{BOLD}{grade}{RESET} ({score} / 100 points)")
    print()

    structured = {
        "status": "success",
        "target": target_url,
        "status_code": status_code,
        "score": score,
        "grade": grade,
        "findings": findings,
        "information_disclosures": [{"header": k, "value": v} for k, v in leaks],
        "summary": f"Target {target_url} scored {score}/100 ({grade}) with {len([f for f in findings if f['status'] == 'pass'])} security headers present and {len([f for f in findings if f['status'] == 'missing'])} missing."
    }

    print(f"{BOLD}[+] Structured Findings Summary:{RESET}")
    print("<<<CYBERSUITE_FINDINGS_JSON>>>")
    print(json.dumps(structured))
    print("<<<END_CYBERSUITE_FINDINGS_JSON>>>")

if __name__ == "__main__":
    main()
