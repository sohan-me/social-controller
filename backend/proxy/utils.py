"""Parse proxy string ip:port:username:password (password may contain colons)."""


def parse_proxy_string(s):
    """
    Parse a single proxy string into (host, port, username, password).
    Format: ip:port:username:password
    Password may contain colons, so we split from the left and take the last segment as password.
    Returns None if invalid.
    """
    s = (s or '').strip()
    if not s:
        return None
    parts = s.split(':')
    if len(parts) < 4:
        return None
    try:
        host = parts[0].strip()
        port = int(parts[1].strip())
        username = parts[2].strip()
        password = ':'.join(parts[3:]).strip()
        if not host or port <= 0 or port > 65535:
            return None
        return {'host': host, 'port': port, 'username': username, 'password': password}
    except (ValueError, IndexError):
        return None


def parse_bulk_proxy_input(text):
    """
    Split text by newlines, then each line by commas; each segment is one proxy string.
    Returns list of dicts (valid) and list of (raw_string, error) for invalid.
    """
    if not text or not isinstance(text, str):
        return [], []
    valid = []
    errors = []
    lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    for line in lines:
        for segment in line.split(','):
            segment = segment.strip()
            if not segment:
                continue
            parsed = parse_proxy_string(segment)
            if parsed:
                valid.append(parsed)
            else:
                errors.append((segment, 'Invalid format: expected ip:port:username:password'))
    return valid, errors
