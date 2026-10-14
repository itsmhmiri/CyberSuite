#!/usr/bin/env python3
"""
Async Banner Scanner - High-Speed Asynchronous TCP Port Scanner & Banner Grabber
Author: itsmhmiri (https://github.com/itsmhmiri/async-banner-scanner)
"""

import argparse
import asyncio
import json
import re
import socket
import sys
import time

RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
RED = "\033[31m"
BLUE = "\033[34m"
DIM = "\033[2m"
MAGENTA = "\033[35m"

KNOWN_SERVICES = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    465: "SMTPS",
    587: "Submission",
    993: "IMAPS",
    995: "POP3S",
    1433: "MSSQL",
    1521: "Oracle",
    3000: "Node / Web Dev",
    3306: "MySQL / MariaDB",
    3389: "RDP",
    5432: "PostgreSQL",
    6379: "Redis",
    8000: "HTTP Alt",
    8080: "HTTP Proxy / Web",
    8443: "HTTPS Alt",
    9000: "SonarQube / PHP-FPM",
    27017: "MongoDB"
}

def parse_ports(ports_arg):
    ports = set()
    for part in ports_arg.split(','):
        part = part.strip()
        if '-' in part:
            try:
                start, end = part.split('-')
                start_p, end_p = int(start), int(end)
                for p in range(max(1, start_p), min(65535, end_p) + 1):
                    ports.add(p)
            except ValueError:
                continue
        elif part.isdigit():
            p = int(part)
            if 1 <= p <= 65535:
                ports.add(p)
    return sorted(list(ports))

async def grab_banner(reader, writer, port, timeout=2.0):
    try:
        # For HTTP ports, send a quick HEAD probe
        if port in (80, 8080, 8000, 3000, 5000, 8443):
            writer.write(b"HEAD / HTTP/1.0\r\nHost: target\r\n\r\n")
            await writer.drain()
        elif port == 6379:
            writer.write(b"PING\r\n")
            await writer.drain()

        # Read banner line
        data = await asyncio.wait_for(reader.read(512), timeout=timeout)
        banner = data.decode('utf-8', errors='ignore').strip()
        # Clean control characters
        banner = re.sub(r'[\r\n]+', ' | ', banner)
        return banner[:120] if banner else None
    except Exception:
        return None

async def scan_port(host, port, timeout, should_grab_banner, semaphore):
    async with semaphore:
        start = time.time()
        try:
            conn_coro = asyncio.open_connection(host, port)
            reader, writer = await asyncio.wait_for(conn_coro, timeout=timeout)
            latency = round((time.time() - start) * 1000, 1)
            
            banner = None
            if should_grab_banner:
                banner = await grab_banner(reader, writer, port, timeout=1.2)
            
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass

            service = KNOWN_SERVICES.get(port, "Unknown")
            return {
                "port": port,
                "protocol": "tcp",
                "state": "open",
                "service": service,
                "latency_ms": latency,
                "banner": banner
            }
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return None

async def main_async(args):
    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print(f"{CYAN}{BOLD}      Async Banner Scanner v1.3.0 - High-Speed TCP Prober        {RESET}")
    print(f"{CYAN}{BOLD}      Author: itsmhmiri | https://github.com/itsmhmiri          {RESET}")
    print(f"{CYAN}{BOLD}================================================================={RESET}")
    print()

    # Resolve IP
    try:
        ip = socket.gethostbyname(args.target)
    except socket.gaierror as e:
        print(f"{RED}[-] Error: Unable to resolve hostname '{args.target}': {e}{RESET}")
        sys.exit(1)

    ports = parse_ports(args.ports)
    if not ports:
        print(f"{RED}[-] Error: No valid ports specified!{RESET}")
        sys.exit(1)

    print(f"{BLUE}[*]{RESET} Target Host: {BOLD}{args.target}{RESET} ({ip})")
    print(f"{BLUE}[*]{RESET} Ports to scan: {len(ports)} ports [{ports[0]} .. {ports[-1]}]")
    print(f"{BLUE}[*]{RESET} Concurrency: {args.concurrency} concurrent sockets | Timeout: {args.timeout}s")
    print(f"{BLUE}[*]{RESET} Banner grabbing: {'Enabled' if args.grab_banner else 'Disabled'}")
    print()

    print(f"{BOLD}{'Port':<10} {'State':<10} {'Service':<18} {'Latency':<10} {'Banner / Fingerprint':<35}{RESET}")
    print(f"{DIM}{'-' * 85}{RESET}")

    semaphore = asyncio.Semaphore(args.concurrency)
    start_time = time.time()

    tasks = [scan_port(ip, port, args.timeout, args.grab_banner, semaphore) for port in ports]
    results = await asyncio.gather(*tasks)

    open_ports = [r for r in results if r is not None]
    open_ports.sort(key=lambda x: x['port'])

    for item in open_ports:
        port_str = f"{item['port']}/tcp"
        state_str = f"{GREEN}{BOLD}OPEN{RESET}"
        service_str = f"{CYAN}{item['service']}{RESET}"
        latency_str = f"{item['latency_ms']}ms"
        banner_str = item['banner'] if item['banner'] else f"{DIM}(no banner returned){RESET}"
        if len(banner_str) > 40:
            banner_str = banner_str[:37] + "..."
        print(f"{port_str:<10} {state_str:<19} {service_str:<27} {latency_str:<10} {banner_str}")

    elapsed = round(time.time() - start_time, 2)
    print(f"{DIM}{'-' * 85}{RESET}")
    print(f"{GREEN}[+]{RESET} Scan completed in {elapsed}s. {len(ports)} scanned, {BOLD}{len(open_ports)}{RESET} open ports detected.")
    print()

    # Emit structured findings
    structured = {
        "status": "success",
        "target": args.target,
        "target_ip": ip,
        "scanned_ports_count": len(ports),
        "open_ports_count": len(open_ports),
        "execution_time_seconds": elapsed,
        "open_ports": open_ports,
        "summary": f"Identified {len(open_ports)} open TCP ports on {args.target} ({ip}) with service banners."
    }

    print(f"{BOLD}[+] Structured Findings Summary:{RESET}")
    print("<<<CYBERSUITE_FINDINGS_JSON>>>")
    print(json.dumps(structured))
    print("<<<END_CYBERSUITE_FINDINGS_JSON>>>")

def main():
    parser = argparse.ArgumentParser(description="Async Banner Scanner - High-Speed Port & Banner Grabber")
    parser.add_argument("-t", "--target", required=True, help="Target Hostname or IP address")
    parser.add_argument("-p", "--ports", default="21,22,25,53,80,110,143,443,3000,3306,5432,6379,8000,8080,8443,9000", help="Comma-separated ports or range (e.g. 1-1024)")
    parser.add_argument("-c", "--concurrency", type=int, default=40, help="Concurrency limit")
    parser.add_argument("--timeout", type=float, default=1.5, help="Socket timeout in seconds")
    parser.add_argument("--grab-banner", action="store_true", default=False, help="Attempt service banner grabbing")

    args = parser.parse_args()
    asyncio.run(main_async(args))

if __name__ == "__main__":
    main()
