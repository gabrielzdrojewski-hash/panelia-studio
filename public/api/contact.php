<?php

declare(strict_types=1);

/**
 * Panelia Studio — Contact Gateway (Fatica ERP).
 *
 * Przepływ:
 *   przeglądarka -> POST /api/contact (ten plik) -> POST https://crm3.fatica.pl/api/public/leads
 *
 * Token i adres ERP pozostają WYŁĄCZNIE po stronie serwera, w bezpiecznym pliku poza web-rootem:
 * /home/kdurwolrtv/domains/paneliastudio.pl/secure_config/panelia-erp-config.php (700 / plik 600).
 * NIE używamy private_html (dowiązanie do public_html) ani żadnego fallbacku do web-rootu.
 * Nigdy nie trafiają do klienta.
 *
 * Plik jest testowalny: gdy zdefiniowano stałą PANELIA_CONTACT_TEST, żądanie nie jest
 * automatycznie obsługiwane — udostępnione są tylko czyste funkcje pomocnicze.
 */

// ------------------------------------------------------------------
// Ustawienia bezpieczeństwa błędów: nic nie wyciekać do klienta.
// ------------------------------------------------------------------
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '0'); // logujemy sami, w prywatnym katalogu

const PANELIA_ALLOWED_PACKAGES = [
    'panelia_concept',
    'panelia_complete',
    'panelia_signature',
    'panelia_finish_start',
    'panelia_finish_comfort',
    'panelia_finish_premium',
];

const PANELIA_ALLOWED_HOSTS = ['paneliastudio.pl', 'www.paneliastudio.pl'];
const PANELIA_ALLOWED_ORIGINS = ['https://paneliastudio.pl', 'https://www.paneliastudio.pl'];
const PANELIA_MAX_BODY_BYTES = 32768; // 32 KB
const PANELIA_MIN_FORM_SECONDS = 2;

// ==================================================================
// KONFIGURACJA
// ==================================================================

/**
 * Bezpieczna ścieżka konfiguracji produkcyjnej — POZA web-rootem, na tym koncie hostingowym.
 * UWAGA: na tym hostingu `private_html` jest dowiązaniem do `public_html`, więc NIE jest prywatny
 * i NIE wolno go używać. Jedynym źródłem konfiguracji jest `secure_config` (700 / plik 600).
 */
function panelia_secure_config_path(): string
{
    return '/home/kdurwolrtv/domains/paneliastudio.pl/secure_config/panelia-erp-config.php';
}

/** public_html = katalog nadrzędny „api" (gateway leży w public_html/api/contact.php). */
function panelia_public_html_dir(): ?string
{
    $dir = realpath(dirname(__DIR__));
    return $dir === false ? null : $dir;
}

/** Czy $path leży w katalogu $dir (po normalizacji separatorów; porównanie na granicy segmentu). */
function panelia_path_is_inside(string $path, string $dir): bool
{
    $p = rtrim(str_replace('\\', '/', $path), '/');
    $d = rtrim(str_replace('\\', '/', $dir), '/');
    if ($d === '') {
        return false;
    }
    return $p === $d || strncmp($p . '/', $d . '/', strlen($d) + 1) === 0;
}

/**
 * Ładuje konfigurację PRODUKCYJNĄ WYŁĄCZNIE z bezpiecznego pliku poza web-rootem
 * (domyślnie secure_config/panelia-erp-config.php). BRAK jakiegokolwiek fallbacku do private_html,
 * public_html, katalogu repozytorium ani zmiennych env prowadzących do konfiguracji w web-roocie.
 *
 * Odrzuca (zwraca null → neutralne 503), gdy: plik nie istnieje, nie jest zwykłym plikiem,
 * realpath leży wewnątrz public_html, plik nie zwraca tablicy, endpoint jest pusty, token jest pusty.
 * Logi i rate-limit trafiają do katalogu bezpiecznego pliku (poza web-rootem).
 *
 * Parametry (opcjonalne) służą wyłącznie testowalności — produkcja używa domyślnych.
 */
function panelia_load_config(?string $configFile = null, ?string $publicHtmlDir = null): ?array
{
    $configFile = $configFile ?? panelia_secure_config_path();
    if ($publicHtmlDir === null) {
        $publicHtmlDir = panelia_public_html_dir();
    } else {
        $resolved = realpath($publicHtmlDir);
        $publicHtmlDir = $resolved !== false ? $resolved : $publicHtmlDir;
    }

    // Plik musi istnieć i być ZWYKŁYM plikiem.
    if (! is_file($configFile)) {
        return null;
    }
    $real = realpath($configFile);
    if ($real === false || ! is_file($real)) {
        return null;
    }

    // ODRZUĆ, gdy realpath konfiguracji leży wewnątrz public_html (web-root) — także przez dowiązanie.
    if ($publicHtmlDir !== null && $publicHtmlDir !== '' && panelia_path_is_inside($real, $publicHtmlDir)) {
        return null;
    }

    /** @noinspection PhpIncludeInspection */
    $data = require $real;
    if (! is_array($data)) {
        return null;
    }

    $url = (isset($data['erp_public_leads_url']) && is_string($data['erp_public_leads_url']))
        ? trim($data['erp_public_leads_url']) : '';
    $token = (isset($data['erp_token']) && is_string($data['erp_token']))
        ? trim($data['erp_token']) : '';
    if ($url === '' || $token === '') {
        return null; // pusty endpoint lub pusty token → odrzuć
    }

    $config = [
        'enabled' => true,
        'erp_public_leads_url' => $url,
        'erp_token' => $token,
        'request_timeout_ms' => isset($data['request_timeout_ms']) ? (int) $data['request_timeout_ms'] : 10000,
        'connect_timeout_ms' => isset($data['connect_timeout_ms']) ? (int) $data['connect_timeout_ms'] : 5000,
        'mock' => (bool) ($data['mock'] ?? false),
        'allow_mock' => (bool) ($data['allow_mock'] ?? false),
        'is_production' => (bool) ($data['is_production'] ?? true),
        'rate_limit_max_requests' => isset($data['rate_limit_max_requests']) ? (int) $data['rate_limit_max_requests'] : 5,
        'rate_limit_window_seconds' => isset($data['rate_limit_window_seconds']) ? (int) $data['rate_limit_window_seconds'] : 900,
        'ip_hash_salt' => is_string($data['ip_hash_salt'] ?? null) ? (string) $data['ip_hash_salt'] : '',
        // Logi + rate-limit w katalogu bezpiecznego pliku (secure_config, poza web-rootem).
        'private_dir' => dirname($real),
    ];

    if ($config['ip_hash_salt'] === '') {
        $config['ip_hash_salt'] = hash('sha256', 'ip-salt|' . $token);
    }

    return $config;
}

// ==================================================================
// ODPOWIEDZI / NAGŁÓWKI
// ==================================================================

function panelia_send_json(int $status, array $body): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function panelia_uuid_v4(): string
{
    try {
        $bytes = random_bytes(16);
    } catch (\Throwable $e) {
        $hex = substr(hash('sha256', microtime(true) . '|' . mt_rand()), 0, 32);
        $bytes = hex2bin($hex);
        if ($bytes === false) {
            return '00000000-0000-4000-8000-000000000000';
        }
    }

    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);

    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

function panelia_correlation_id(): string
{
    return panelia_uuid_v4();
}

// ==================================================================
// WALIDACJA (czyste funkcje)
// ==================================================================

function panelia_strip_html(string $v): string
{
    // Usuń tagi HTML, zdekoduj encje, odetnij znaki sterujące (poza \n \r \t).
    $v = strip_tags($v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return $v;
}

function panelia_clean_line(string $v): string
{
    return trim(preg_replace('/\s+/u', ' ', panelia_strip_html($v)) ?? '');
}

/**
 * Waliduje surowe dane wejściowe. Zwraca [ 'ok' => bool, 'data' => array, 'errors' => array ].
 * 'errors' zawiera wyłącznie publiczne nazwy pól i bezpieczne komunikaty.
 */
function panelia_validate(array $in): array
{
    $errors = [];
    $out = [];

    // name
    $name = is_string($in['name'] ?? null) ? panelia_clean_line($in['name']) : '';
    if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 200) {
        $errors['name'] = 'Podaj imię i nazwisko (2–200 znaków).';
    }
    $out['name'] = $name;

    // email
    $emailRaw = is_string($in['email'] ?? null) ? trim($in['email']) : '';
    $email = mb_strtolower($emailRaw);
    if ($email === '' || mb_strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Podaj poprawny adres e-mail.';
    }
    $out['email'] = $email;

    // phone (opcjonalne)
    $phone = '';
    if (isset($in['phone']) && is_string($in['phone']) && trim($in['phone']) !== '') {
        $raw = panelia_strip_html($in['phone']);
        $plus = (strncmp(ltrim($raw), '+', 1) === 0) ? '+' : '';
        $digits = preg_replace('/[^0-9]/', '', $raw) ?? '';
        $phone = $plus . $digits;
        if (mb_strlen($phone) > 50 || mb_strlen($digits) < 6) {
            $errors['phone'] = 'Podaj poprawny numer telefonu.';
        }
    }
    $out['phone'] = $phone;

    // message
    $messageRaw = is_string($in['message'] ?? null) ? $in['message'] : '';
    $message = trim(panelia_strip_html($messageRaw));
    if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
        $errors['message'] = 'Wiadomość powinna mieć od 10 do 5000 znaków.';
    }
    $out['message'] = $message;

    // consent — dokładnie true
    $consent = ($in['consent'] ?? null) === true;
    if (!$consent) {
        $errors['consent'] = 'Zgoda jest wymagana, aby wysłać zgłoszenie.';
    }
    $out['consent'] = $consent;

    // package_interest (opcjonalne, tylko dozwolone)
    $pkg = null;
    if (isset($in['package_interest']) && is_string($in['package_interest']) && $in['package_interest'] !== '') {
        if (in_array($in['package_interest'], PANELIA_ALLOWED_PACKAGES, true)) {
            $pkg = $in['package_interest'];
        } else {
            $errors['package_interest'] = 'Wybierz pakiet z listy.';
        }
    }
    $out['package_interest'] = $pkg;

    return ['ok' => count($errors) === 0, 'data' => $out, 'errors' => $errors];
}

function panelia_safe_url(?string $v, int $max = 1000): ?string
{
    if (!is_string($v) || trim($v) === '') {
        return null;
    }
    $v = trim($v);
    if (mb_strlen($v) > $max) {
        return null;
    }
    $parts = parse_url($v);
    if ($parts === false || !isset($parts['scheme']) || !in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
        return null;
    }
    return $v;
}

function panelia_landing_page(?string $v): ?string
{
    $url = panelia_safe_url($v);
    if ($url === null) {
        return null;
    }
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
    return in_array($host, PANELIA_ALLOWED_HOSTS, true) ? $url : null;
}

function panelia_utm(?string $v): ?string
{
    if (!is_string($v) || trim($v) === '') {
        return null;
    }
    $v = panelia_clean_line($v);
    return mb_substr($v, 0, 250);
}

function panelia_iso_or_now(?string $v): string
{
    if (is_string($v) && trim($v) !== '' && mb_strlen(trim($v)) <= 40) {
        $ts = strtotime($v);
        if ($ts !== false) {
            return gmdate('c', $ts);
        }
    }
    return gmdate('c');
}

function panelia_is_idempotency_key(string $v): bool
{
    return (bool) preg_match(
        '/^panelia-contact-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
        $v
    );
}

/**
 * Buduje payload do ERP z ZWALIDOWANYCH danych + bezpiecznych metadanych z requestu.
 * `source` jest ZAWSZE wymuszane serwerowo. Pola niezaufane od klienta (source, organization_id,
 * organization_slug, notification_recipients, sender_email, token) są ignorowane — nie są odczytywane.
 * Zwraca wyłącznie udokumentowane pola.
 */
function panelia_build_erp_payload(array $data, array $in, string $idem): array
{
    return [
        'name' => $data['name'],
        'email' => $data['email'],
        'phone' => ($data['phone'] ?? '') !== '' ? $data['phone'] : null,
        'package_interest' => $data['package_interest'] ?? null,
        'message' => $data['message'],
        'consent' => true,
        'submitted_at' => panelia_iso_or_now(is_string($in['submitted_at'] ?? null) ? $in['submitted_at'] : null),
        'source' => 'paneliastudio.pl',
        'landing_page' => panelia_landing_page(is_string($in['landing_page'] ?? null) ? $in['landing_page'] : null),
        'referrer' => panelia_safe_url(is_string($in['referrer'] ?? null) ? $in['referrer'] : null),
        'utm_source' => panelia_utm($in['utm_source'] ?? null),
        'utm_medium' => panelia_utm($in['utm_medium'] ?? null),
        'utm_campaign' => panelia_utm($in['utm_campaign'] ?? null),
        'utm_content' => panelia_utm($in['utm_content'] ?? null),
        'utm_term' => panelia_utm($in['utm_term'] ?? null),
        'idempotency_key' => $idem,
    ];
}

function panelia_make_idempotency_key(): string
{
    return 'panelia-contact-' . panelia_uuid_v4();
}

// ==================================================================
// RATE LIMIT (pliki + flock, hash IP)
// ==================================================================

function panelia_client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function panelia_ip_hash(string $ip, string $salt): string
{
    return hash('sha256', $salt . '|' . $ip);
}

/**
 * Zwraca [ 'allowed' => bool, 'retry_after' => int, 'error' => bool ].
 * 'error' = true przy poważnym problemie ochrony (wywołujący zwróci neutralny 503).
 */
function panelia_rate_limit(array $config, string $ipHash): array
{
    $dir = ($config['private_dir'] ?? '') . '/panelia-rate-limit';
    $max = (int) ($config['rate_limit_max_requests'] ?? 5);
    $window = (int) ($config['rate_limit_window_seconds'] ?? 900);

    if (($config['private_dir'] ?? '') === '') {
        return ['allowed' => false, 'retry_after' => $window, 'error' => true];
    }
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return ['allowed' => false, 'retry_after' => $window, 'error' => true];
    }

    $path = $dir . '/' . $ipHash . '.json';
    $now = time();

    $fp = @fopen($path, 'c+');
    if ($fp === false) {
        return ['allowed' => false, 'retry_after' => $window, 'error' => true];
    }
    try {
        if (!flock($fp, LOCK_EX)) {
            return ['allowed' => false, 'retry_after' => $window, 'error' => true];
        }
        $raw = stream_get_contents($fp);
        $hits = [];
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $hits = array_values(array_filter($decoded, static fn($t) => is_int($t) && ($now - $t) < $window));
            }
        }

        if (count($hits) >= $max) {
            $oldest = min($hits);
            $retry = max(1, $window - ($now - $oldest));
            flock($fp, LOCK_UN);
            return ['allowed' => false, 'retry_after' => $retry, 'error' => false];
        }

        $hits[] = $now;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($hits));
        fflush($fp);
        flock($fp, LOCK_UN);
        return ['allowed' => true, 'retry_after' => 0, 'error' => false];
    } finally {
        fclose($fp);
    }
}

// ==================================================================
// LOG (prywatny, zamaskowany)
// ==================================================================

function panelia_mask_email(string $email): string
{
    $at = strpos($email, '@');
    if ($at === false) {
        return '***';
    }
    $local = substr($email, 0, $at);
    $domain = substr($email, $at + 1);
    $localMask = mb_substr($local, 0, 1) . '***';
    return $localMask . '@' . $domain;
}

function panelia_log(array $config, array $fields): void
{
    $dir = ($config['private_dir'] ?? '') . '/logs';
    if (($config['private_dir'] ?? '') === '') {
        return;
    }
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return; // błąd zapisu logu nie może ujawnić ścieżki klientowi
    }
    $fields['ts'] = gmdate('c');
    $line = json_encode($fields, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    @file_put_contents($dir . '/panelia-contact.log', $line . "\n", FILE_APPEND | LOCK_EX);
}

// ==================================================================
// WYSYŁKA DO ERP (cURL + retry)
// ==================================================================

function panelia_build_erp_headers(
    string $token,
    string $idempotencyKey,
    string $correlationId
): array {
    return [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json',
        'Idempotency-Key: ' . $idempotencyKey,
        'X-Correlation-ID: ' . $correlationId,
    ];
}

function panelia_is_retryable_result(
    int $status,
    bool $timeout,
    bool $transport
): bool {
    return $timeout || $transport || in_array($status, [429, 502, 503, 504], true);
}

function panelia_retry_delay_us(int $status, ?int $retryAfter): int
{
    if ($status === 429) {
        $seconds = max(1, min($retryAfter ?? 1, 2));
        return $seconds * 1000000;
    }
    return 350000;
}

function panelia_is_erp_success(int $status, ?array $body): bool
{
    if (!is_array($body) || ($body['ok'] ?? null) !== true) {
        return false;
    }

    if ($status === 201) {
        return ($body['duplicate'] ?? null) === false
            && ($body['status'] ?? null) === 'created';
    }

    if ($status === 200) {
        return ($body['duplicate'] ?? null) === true
            && ($body['status'] ?? null) === 'duplicate';
    }

    return false;
}

function panelia_mock_enabled(array $config): bool
{
    return ($config['mock'] ?? false) === true
        && ($config['allow_mock'] ?? false) === true
        && ($config['is_production'] ?? true) === false;
}

/**
 * Zwraca [ 'status' => int, 'body' => array|null, 'timeout' => bool, 'transport' => bool,
 *          'attempts' => int, 'duration_ms' => int, 'retry_after' => ?int ].
 */
function panelia_send_to_erp(array $config, array $payload, string $correlationId): array
{
    // Brak rozszerzenia cURL → neutralny błąd transportowy (mapowany na 503), bez szczegółów.
    if (!function_exists('curl_init')) {
        return ['status' => 0, 'body' => null, 'timeout' => false, 'transport' => true,
            'attempts' => 0, 'duration_ms' => 0, 'retry_after' => null];
    }

    $url = $config['erp_public_leads_url'];
    $token = $config['erp_token'];
    $connectMs = (int) ($config['connect_timeout_ms'] ?? 5000);
    $totalMs = (int) ($config['request_timeout_ms'] ?? 10000);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $headers = panelia_build_erp_headers(
        $token,
        (string) $payload['idempotency_key'],
        $correlationId
    );

    $attempt = 0;
    $maxAttempts = 2; // 1 pierwotna + 1 retry
    $start = microtime(true);
    $last = ['status' => 0, 'body' => null, 'timeout' => false, 'transport' => false, 'retry_after' => null];

    while ($attempt < $maxAttempts) {
        $attempt++;
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => false,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_CONNECTTIMEOUT_MS => $connectMs,
            CURLOPT_TIMEOUT_MS => $totalMs,
        ]);
        $respHeaders = [];
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function ($ch, $header) use (&$respHeaders) {
            $len = strlen($header);
            $p = explode(':', $header, 2);
            if (count($p) === 2) {
                $respHeaders[strtolower(trim($p[0]))] = trim($p[1]);
            }
            return $len;
        });

        $respBody = curl_exec($ch);
        $errno = curl_errno($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $timeout = in_array($errno, [CURLE_OPERATION_TIMEOUTED, CURLE_COULDNT_CONNECT], true);
        $transport = ($errno !== 0);
        $retryAfter = isset($respHeaders['retry-after']) && ctype_digit($respHeaders['retry-after'])
            ? (int) $respHeaders['retry-after'] : null;

        $bodyArr = null;
        if (is_string($respBody) && $respBody !== '') {
            $decoded = json_decode($respBody, true);
            if (is_array($decoded)) {
                $bodyArr = $decoded;
            }
        }

        $last = [
            'status' => $status,
            'body' => $bodyArr,
            'timeout' => $timeout,
            'transport' => $transport,
            'attempts' => $attempt,
            'duration_ms' => (int) round((microtime(true) - $start) * 1000),
            'retry_after' => $retryAfter,
        ];

        $retryable = panelia_is_retryable_result($status, $timeout, $transport);
        if (!$retryable || $attempt >= $maxAttempts) {
            break;
        }
        usleep(panelia_retry_delay_us($status, $retryAfter));
    }

    $last['attempts'] = $attempt;
    $last['duration_ms'] = (int) round((microtime(true) - $start) * 1000);
    return $last;
}

// ==================================================================
// GŁÓWNA OBSŁUGA ŻĄDANIA
// ==================================================================

function panelia_contact_main(): void
{
    $correlationId = panelia_correlation_id();
    $config = panelia_load_config();

    // --- Metoda ---
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method !== 'POST') {
        header('Allow: POST');
        panelia_send_json(405, ['ok' => false, 'message' => 'Metoda niedozwolona.', 'request_id' => $correlationId]);
    }

    // --- Origin / Referer ---
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if (is_string($origin) && $origin !== '' && !in_array($origin, PANELIA_ALLOWED_ORIGINS, true)) {
        panelia_send_json(403, ['ok' => false, 'message' => 'Żądanie odrzucone.', 'request_id' => $correlationId]);
    }
    $referer = $_SERVER['HTTP_REFERER'] ?? null;
    if (is_string($referer) && $referer !== '') {
        $rHost = strtolower(parse_url($referer, PHP_URL_HOST) ?? '');
        if ($rHost !== '' && !in_array($rHost, PANELIA_ALLOWED_HOSTS, true)) {
            panelia_send_json(403, ['ok' => false, 'message' => 'Żądanie odrzucone.', 'request_id' => $correlationId]);
        }
    }

    // --- Content-Type ---
    $ctype = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (strpos($ctype, 'application/json') === false) {
        panelia_send_json(415, ['ok' => false, 'message' => 'Wymagany format JSON.', 'request_id' => $correlationId]);
    }

    // --- Body + limit rozmiaru ---
    $raw = file_get_contents('php://input', false, null, 0, PANELIA_MAX_BODY_BYTES + 1);
    if ($raw === false || strlen($raw) > PANELIA_MAX_BODY_BYTES) {
        panelia_send_json(413, ['ok' => false, 'message' => 'Żądanie jest zbyt duże.', 'request_id' => $correlationId]);
    }
    $in = json_decode($raw === '' ? 'null' : $raw, true);
    if (!is_array($in)) {
        panelia_send_json(400, ['ok' => false, 'message' => 'Nieprawidłowe dane żądania.', 'request_id' => $correlationId]);
    }

    // Konfiguracja produkcyjna MUSI pochodzić z bezpiecznego pliku poza web-rootem (secure_config).
    // Brak/nieprawidłowa konfiguracja → neutralne 503 (bez ujawniania ścieżek, tokenu, konfiguracji, trace).
    if ($config === null) {
        panelia_send_json(503, ['ok' => false, 'message' => 'Formularz jest chwilowo niedostępny. Skontaktuj się z nami bezpośrednio.', 'request_id' => $correlationId]);
    }

    $ip = panelia_client_ip();
    $ipHash = panelia_ip_hash($ip, (string) ($config['ip_hash_salt'] ?? 'panelia'));

    // --- Honeypot ---
    $honeypot = is_string($in['company'] ?? null) ? trim($in['company']) : '';
    if ($honeypot !== '') {
        panelia_log($config, ['cid' => $correlationId, 'stage' => 'honeypot', 'result' => 'blocked', 'ip_hash' => $ipHash]);
        panelia_send_json(200, ['ok' => true, 'message' => 'Dziękujemy. Otrzymaliśmy Twoje zgłoszenie.', 'request_id' => $correlationId]);
    }

    // --- Minimalny czas formularza ---
    $startedAt = $in['form_started_at'] ?? null;
    if (is_string($startedAt) || is_int($startedAt)) {
        $startTs = is_int($startedAt) ? (int) ($startedAt / 1000) : strtotime((string) $startedAt);
        if ($startTs !== false && (time() - $startTs) < PANELIA_MIN_FORM_SECONDS) {
            panelia_log($config, ['cid' => $correlationId, 'stage' => 'min_time', 'result' => 'blocked', 'ip_hash' => $ipHash]);
            panelia_send_json(200, ['ok' => true, 'message' => 'Dziękujemy. Otrzymaliśmy Twoje zgłoszenie.', 'request_id' => $correlationId]);
        }
    }

    // --- Walidacja ---
    $v = panelia_validate($in);
    if (!$v['ok']) {
        panelia_send_json(422, [
            'ok' => false,
            'message' => 'Sprawdź zaznaczone pola formularza.',
            'field_errors' => $v['errors'],
            'request_id' => $correlationId,
        ]);
    }
    $data = $v['data'];

    // --- Rate limit ---
    $rl = panelia_rate_limit($config, $ipHash);
    if ($rl['error']) {
        panelia_send_json(503, ['ok' => false, 'message' => 'Formularz jest chwilowo niedostępny. Skontaktuj się z nami bezpośrednio.', 'request_id' => $correlationId]);
    }
    if (!$rl['allowed']) {
        if ($rl['retry_after'] > 0) {
            header('Retry-After: ' . (int) $rl['retry_after']);
        }
        panelia_send_json(429, ['ok' => false, 'message' => 'Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie za chwilę.', 'request_id' => $correlationId]);
    }

    // --- Idempotency key (frontend generuje; serwer tylko awaryjnie) ---
    $idem = is_string($in['idempotency_key'] ?? null) ? trim($in['idempotency_key']) : '';
    if ($idem === '' || mb_strlen($idem) > 190 || !panelia_is_idempotency_key($idem)) {
        $idem = panelia_make_idempotency_key();
    }

    // --- Budowa payloadu do ERP (source zawsze ustawiany serwerowo; pola niezaufane ignorowane) ---
    $payload = panelia_build_erp_payload($data, $in, $idem);

    $logBase = [
        'cid' => $correlationId,
        'ip_hash' => $ipHash,
        'landing' => $payload['landing_page'] ? (parse_url($payload['landing_page'], PHP_URL_PATH) ?: '/') : null,
        'email_mask' => panelia_mask_email($data['email']),
        'package' => $data['package_interest'],
    ];

    // --- Konfiguracja niekompletna → bezpieczny błąd (nigdy fałszywy sukces) ---
    // Mock aktywny WYŁĄCZNIE gdy jednocześnie mock=true ORAZ allow_mock=true (oba z prywatnej
    // konfiguracji/env serwera). Samo mock=true na produkcji nie udaje sukcesu.
    $mock = panelia_mock_enabled($config);
    if (!$mock) {
        if (($config['enabled'] ?? false) !== true || ($config['erp_token'] ?? '') === '') {
            panelia_log($config, $logBase + ['stage' => 'config', 'result' => 'failure', 'error' => 'not_configured']);
            panelia_send_json(503, ['ok' => false, 'message' => 'Formularz jest chwilowo niedostępny. Skontaktuj się z nami bezpośrednio.', 'request_id' => $correlationId]);
        }
    }

    // --- MOCK (tylko przy jawnej konfiguracji prywatnej) ---
    if ($mock) {
        $sim = is_string($in['mock_scenario'] ?? null) ? $in['mock_scenario'] : '201';
        panelia_log($config, $logBase + ['stage' => 'mock', 'result' => 'mock', 'scenario' => $sim]);
        panelia_handle_result(panelia_mock_result($sim), $correlationId, $config, $logBase);
        return;
    }

    // --- Wysyłka do ERP ---
    $result = panelia_send_to_erp($config, $payload, $correlationId);
    panelia_log($config, $logBase + [
        'stage' => 'erp',
        'attempts' => $result['attempts'],
        'duration_ms' => $result['duration_ms'],
        'erp_status' => $result['status'],
        'timeout' => $result['timeout'],
        'result' => panelia_is_erp_success((int) $result['status'], $result['body'] ?? null)
            ? 'success'
            : 'failure',
    ]);
    panelia_handle_result($result, $correlationId, $config, $logBase);
}

function panelia_mock_result(string $scenario): array
{
    return match ($scenario) {
        '200_duplicate' => [
            'status' => 200,
            'body' => [
                'ok' => true,
                'duplicate' => true,
                'idempotent' => true,
                'status' => 'duplicate',
                'lead_id' => 'mock-lead',
                'correlation_id' => '00000000-0000-4000-8000-000000000001',
            ],
            'timeout' => false,
            'transport' => false,
            'retry_after' => null,
        ],
        '422' => [
            'status' => 422,
            'body' => ['errors' => ['email' => ['Podaj poprawny adres e-mail.']]],
            'timeout' => false,
            'transport' => false,
            'retry_after' => null,
        ],
        '429' => [
            'status' => 429,
            'body' => ['message' => 'Too Many Attempts.'],
            'timeout' => false,
            'transport' => false,
            'retry_after' => 1,
        ],
        '503' => [
            'status' => 503,
            'body' => null,
            'timeout' => false,
            'transport' => false,
            'retry_after' => null,
        ],
        'timeout' => [
            'status' => 0,
            'body' => null,
            'timeout' => true,
            'transport' => true,
            'retry_after' => null,
        ],
        default => [
            'status' => 201,
            'body' => [
                'ok' => true,
                'duplicate' => false,
                'status' => 'created',
                'lead_id' => 'mock-lead',
                'organization' => 'panelia-studio',
                'assigned' => true,
                'possible_duplicate' => false,
                'correlation_id' => '00000000-0000-4000-8000-000000000001',
            ],
            'timeout' => false,
            'transport' => false,
            'retry_after' => null,
        ],
    };
}

/**
 * Mapuje wynik ERP na bezpieczną odpowiedź do przeglądarki.
 */
function panelia_handle_result(array $result, string $correlationId, array $config, array $logBase): void
{
    $status = (int) ($result['status'] ?? 0);

    // Sukces wyłącznie przy finalnym kontrakcie ERP:
    // 201 + ok=true + duplicate=false + status=created
    // 200 + ok=true + duplicate=true + status=duplicate
    if (panelia_is_erp_success($status, $result['body'] ?? null)) {
        panelia_send_json(200, [
            'ok' => true,
            'message' => 'Dziękujemy. Otrzymaliśmy Twoje zgłoszenie. Zespół Panelia Studio skontaktuje się z Tobą.',
            'request_id' => $correlationId,
        ]);
    }

    if ($status === 200 || $status === 201) {
        panelia_log($config, $logBase + [
            'stage' => 'erp_contract',
            'result' => 'failure',
            'error' => 'unexpected_success_shape',
            'erp_status' => $status,
        ]);
        panelia_send_json(502, [
            'ok' => false,
            'message' => 'Nie udało się teraz wysłać formularza. Spróbuj ponownie za chwilę lub skontaktuj się z nami bezpośrednio.',
            'request_id' => $correlationId,
        ]);
    }

    // Walidacja po stronie ERP.
    if ($status === 422) {
        $fieldErrors = [];
        $bodyErrors = $result['body']['field_errors']
            ?? $result['body']['errors']
            ?? null;
        if (is_array($bodyErrors)) {
            foreach ($bodyErrors as $field => $msg) {
                if (!in_array($field, ['name', 'email', 'phone', 'message', 'consent', 'package_interest'], true)) {
                    continue;
                }

                if (is_array($msg)) {
                    $msg = $msg[0] ?? null;
                }
                if (is_string($msg)) {
                    $fieldErrors[$field] = $msg;
                }
            }
        }
        panelia_send_json(422, [
            'ok' => false,
            'message' => 'Sprawdź zaznaczone pola formularza.',
            'field_errors' => $fieldErrors ?: ['message' => 'Sprawdź poprawność danych.'],
            'request_id' => $correlationId,
        ]);
    }

    // Problem autoryzacji/konfiguracji po stronie ERP → dla klienta neutralne 503.
    if ($status === 401 || $status === 403) {
        panelia_send_json(503, ['ok' => false, 'message' => 'Formularz jest chwilowo niedostępny. Skontaktuj się z nami bezpośrednio.', 'request_id' => $correlationId]);
    }

    // Zbyt wiele żądań.
    if ($status === 429) {
        if (!empty($result['retry_after'])) {
            header('Retry-After: ' . (int) $result['retry_after']);
        }
        panelia_send_json(429, ['ok' => false, 'message' => 'Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie za chwilę.', 'request_id' => $correlationId]);
    }

    // Timeout / transport / 5xx → 503.
    if ($result['timeout'] || $result['transport'] || in_array($status, [500, 502, 503, 504], true)) {
        panelia_send_json(503, ['ok' => false, 'message' => 'Nie udało się teraz wysłać formularza. Spróbuj ponownie za chwilę lub skontaktuj się z nami bezpośrednio.', 'request_id' => $correlationId]);
    }

    // Nieznana odpowiedź → neutralny błąd.
    panelia_send_json(502, ['ok' => false, 'message' => 'Nie udało się teraz wysłać formularza. Spróbuj ponownie za chwilę lub skontaktuj się z nami bezpośrednio.', 'request_id' => $correlationId]);
}

// ------------------------------------------------------------------
// Uruchomienie (pomijane w trybie testowym).
// ------------------------------------------------------------------
if (!defined('PANELIA_CONTACT_TEST')) {
    panelia_contact_main();
}
