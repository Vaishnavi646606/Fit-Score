from datetime import datetime, timezone
import os


def log_memory(phase: str, **details) -> None:
    """Log process RSS for temporary deployment diagnostics."""
    rss_bytes = None

    try:
        with open("/proc/self/status", encoding="utf-8") as status_file:
            for line in status_file:
                if line.startswith("VmRSS:"):
                    rss_bytes = int(line.split()[1]) * 1024
                    break
    except (FileNotFoundError, OSError, ValueError):
        pass

    rss_mib = (
        f"{rss_bytes / (1024 * 1024):.2f}"
        if rss_bytes is not None
        else "unavailable"
    )
    detail_text = " ".join(f"{k}={v}" for k, v in details.items())
    suffix = f" {detail_text}" if detail_text else ""

    print(
        f"[MEMORY] phase={phase} pid={os.getpid()} "
        f"rss_mib={rss_mib} "
        f"timestamp={datetime.now(timezone.utc).isoformat()}{suffix}"
    )