"""
Gmail signup proxy gateway: fetch Google signup page via a random proxy,
rewrite links so all navigation stays on our domain (blocking Android Gmail app).
"""
import re
import uuid
import requests
from urllib.parse import quote_plus, urljoin, urlparse

from django.core.cache import cache
from django.http import HttpResponse, HttpRequest
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt

from .models import Proxy

SESSION_TIMEOUT = 3600  # 1 hour
GOOGLE_SIGNUP_URL = 'https://accounts.google.com/signup'
GOOGLE_ORIGIN = 'https://accounts.google.com'
DESKTOP_UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
)


def get_random_proxy():
    """Return a random Proxy instance or None."""
    return Proxy.objects.order_by('?').first()


def build_proxies_dict(proxy):
    """Build {'http': '...', 'https': '...'} for requests."""
    url = proxy.to_proxy_url()
    return {'http': url, 'https': url}


def parse_set_cookie_headers(response):
    """Extract cookies from response headers; return list of (name, value)."""
    cookies = []
    for key, value in response.headers.items():
        if key.lower() == 'set-cookie':
            part = value.split(';')[0].strip()
            if '=' in part:
                name, val = part.split('=', 1)
                cookies.append((name.strip(), val.strip()))
    return cookies


def merge_cookies(existing_list, new_list):
    """Merge new cookies into existing; same name overwrites. Return list of (name, value)."""
    by_name = dict(existing_list)
    for name, value in new_list:
        by_name[name] = value
    return list(by_name.items())


def build_cookie_header(cookie_list):
    """Build Cookie header value from list of (name, value)."""
    return '; '.join(f'{name}={value}' for name, value in cookie_list)


def rewrite_html_links(html_content, base_url, session_token):
    """Rewrite accounts.google.com links and form actions to our gateway URL."""
    def replacer(match):
        full_url = match.group(1)
        if full_url.startswith('//'):
            full_url = 'https:' + full_url
        elif full_url.startswith('/'):
            full_url = GOOGLE_ORIGIN + full_url
        encoded = quote_plus(full_url)
        return f'{base_url}?url={encoded}&session={session_token}'
    # Replace href="https://accounts.google.com/..." and href="/..."
    html_content = re.sub(
        r'href=["\'](https?://accounts\.google\.com[^"\']*)["\']',
        lambda m: f'href="{base_url}?url={quote_plus(m.group(1))}&session={session_token}"',
        html_content,
        flags=re.IGNORECASE,
    )
    html_content = re.sub(
        r'href=["\']/([^"\']*)["\']',
        lambda m: f'href="{base_url}?url={quote_plus(GOOGLE_ORIGIN + "/" + m.group(1))}&session={session_token}"',
        html_content,
    )
    # Form action
    html_content = re.sub(
        r'action=["\'](https?://accounts\.google\.com[^"\']*)["\']',
        lambda m: f'action="{base_url}?url={quote_plus(m.group(1))}&session={session_token}"',
        html_content,
        flags=re.IGNORECASE,
    )
    html_content = re.sub(
        r'action=["\']/([^"\']*)["\']',
        lambda m: f'action="{base_url}?url={quote_plus(GOOGLE_ORIGIN + "/" + m.group(1))}&session={session_token}"',
        html_content,
    )
    return html_content


def fetch_via_proxy(url, proxy, cookie_list=None, method='GET', data=None, allow_redirects=True):
    """Fetch URL via proxy; return (response, updated_cookie_list)."""
    proxies = build_proxies_dict(proxy)
    headers = {
        'User-Agent': DESKTOP_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    if cookie_list:
        headers['Cookie'] = build_cookie_header(cookie_list)
    try:
        resp = requests.request(
            method,
            url,
            headers=headers,
            data=data,
            proxies=proxies,
            timeout=30,
            allow_redirects=allow_redirects,
        )
    except requests.RequestException:
        return None, cookie_list or []
    new_cookies = parse_set_cookie_headers(resp)
    merged = merge_cookies(cookie_list or [], new_cookies)
    return resp, merged


@method_decorator([csrf_exempt, xframe_options_exempt], name='dispatch')
class GmailSignupProxyView(View):
    """
    GET/POST /api/proxy/gmail-signup/ or ?url=...&session=...
    No auth required so popup/iframe can load.
    """

    def _handle_request(self, request: HttpRequest, method='GET'):
        base_path = request.build_absolute_uri('/api/proxy/gmail-signup/')
        session_token = request.GET.get('session')
        target_url = request.GET.get('url')
        if target_url:
            from urllib.parse import unquote_plus
            target_url = unquote_plus(target_url)

        # No proxies in pool
        proxy = get_random_proxy()
        if not proxy:
            return HttpResponse(
                '<!DOCTYPE html><html><body><h1>No proxies available</h1>'
                '<p>Please ask admin to add proxies.</p></body></html>',
                status=503,
                content_type='text/html',
            )

        # New session: fetch signup page
        if not session_token or not target_url:
            session_token = str(uuid.uuid4())
            target_url = GOOGLE_SIGNUP_URL
            cache_data = {
                'proxy_url': proxy.to_proxy_url(),
                'proxy_id': proxy.id,
                'cookies': [],
            }
            cache.set(f'proxy_session_{session_token}', cache_data, SESSION_TIMEOUT)
        else:
            cache_data = cache.get(f'proxy_session_{session_token}')
            if not cache_data:
                return HttpResponse(
                    '<!DOCTYPE html><html><body><h1>Session expired</h1></body></html>',
                    status=400,
                    content_type='text/html',
                )
            try:
                proxy = Proxy.objects.get(pk=cache_data['proxy_id'])
            except Proxy.DoesNotExist:
                return HttpResponse(
                    '<!DOCTYPE html><html><body><h1>Proxy no longer available</h1></body></html>',
                    status=503,
                    content_type='text/html',
                )

        if method == 'POST':
            data = request.POST.dict() if request.POST else None
        else:
            data = None
        resp, merged_cookies = fetch_via_proxy(
            target_url,
            proxy,
            cookie_list=cache_data.get('cookies', []),
            method=method,
            data=data,
        )
        if resp is None:
            return HttpResponse(
                '<!DOCTYPE html><html><body><h1>Proxy connection failed</h1></body></html>',
                status=502,
                content_type='text/html',
            )

        cache_data['cookies'] = merged_cookies
        cache.set(f'proxy_session_{session_token}', cache_data, SESSION_TIMEOUT)

        content_type = resp.headers.get('Content-Type', 'text/html')
        body = resp.content

        if 'text/html' in content_type and body:
            try:
                html = body.decode('utf-8', errors='replace')
                html = rewrite_html_links(html, base_path, session_token)
                body = html.encode('utf-8')
            except Exception:
                pass

        response = HttpResponse(body, status=resp.status_code, content_type=content_type)
        return response

    def get(self, request: HttpRequest):
        return self._handle_request(request, method='GET')

    def post(self, request: HttpRequest):
        return self._handle_request(request, method='POST')
