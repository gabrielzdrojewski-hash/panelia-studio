<?php

declare(strict_types=1);

/**
 * Panelia Studio — Estimate Gateway (adapter/proxy estymacji Fatica ERP).
 *
 * ROLA: same-origin „brama-wyjście". Przeglądarka rozmawia WYŁĄCZNIE z /api/estimate; ten plik
 * (server-side) proxuje żądanie do publicznego endpointu ERP i mapuje odpowiedź. Token i adres ERP
 * pozostają WYŁĄCZNIE po stronie serwera, w secure_config poza web-rootem — NIGDY w bundlu klienta.
 *
 *   przeglądarka -> POST /api/estimate (ten plik) -> POST {erp_estimate_url}/api/public/estimate
 *
 * CONFIG-GATED: dopóki secure_config nie poda `erp_estimate_url`, adapter zwraca BEZPIECZNIE
 * `not_configured` (503) — NIGDY fałszywej/lokalnie policzonej ceny. Frontend (src/lib/estimate.ts)
 * po `not_configured` dostarcza lead+brief sprawdzonym kanałem /api/contact (bez drugiego systemu leadów).
 *
 * KONTRAKT ERP (zewnętrzne API):
 *   POST /api/public/estimate, auth WebsiteApiToken (Bearer), scope public_estimates:create.
 *   Sukces 2xx: { ok:true, lead_id, lead_delivered:true, result:{ type:'manual_quote'|'estimate', ... } }.
 *   manual_quote = terminalny sukces (ERP nie zgaduje ceny). 422/401/403/429/5xx/503 wg mapowania niżej.
 *
 * Wymagane klucze w secure_config (ustawia operator; ten plik ich NIE zapisuje):
 *   - 'erp_estimate_url'   : pełny URL endpointu ERP (np. https://app.fatica.pl/api/public/estimate)  [WYMAGANE]
 *   - 'erp_estimate_token' : token ze scope public_estimates:create  [OPCJONALNE; brak → reuse 'erp_token']
 *   (opcjonalnie) 'request_timeout_ms','connect_timeout_ms','mock','allow_mock','is_production'
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');

const PANELIA_ESTIMATE_MAX_BODY = 65536; // 64 KB (konfiguracja bywa większa niż kontakt)

function estimate_json(int $status, array $body): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function estimate_request_id(): string
{
    try {
        return 'panelia-estimate-' . bin2hex(random_bytes(9));
    } catch (\Throwable $e) {
        return 'panelia-estimate-' . bin2hex((string) mt_rand());
    }
}

/** Correlation ID — preserve X-Correlation-ID/X-Request-ID z żądania, inaczej generuj (bez PII). */
function estimate_correlation_id(): string
{
    foreach (['HTTP_X_CORRELATION_ID', 'HTTP_X_REQUEST_ID'] as $h) {
        $v = $_SERVER[$h] ?? '';
        if (is_string($v) && trim($v) !== '') {
            return substr(trim($v), 0, 64);
        }
    }

    return estimate_request_id();
}

// ==================================================================
// SERVER-SIDE CONFIG (secure_config poza web-rootem — jak /api/contact)
// ==================================================================

function estimate_secure_config_path(): string
{
    return '/home/kdurwolrtv/domains/paneliastudio.pl/secure_config/panelia-erp-config.php';
}

function estimate_public_html_dir(): ?string
{
    $dir = realpath(dirname(__DIR__));
    return $dir === false ? null : $dir;
}

function estimate_path_is_inside(string $path, string $dir): bool
{
    $p = rtrim(str_replace('\\', '/', $path), '/');
    $d = rtrim(str_replace('\\', '/', $dir), '/');
    if ($d === '') {
        return false;
    }
    return $p === $d || strncmp($p . '/', $d . '/', strlen($d) + 1) === 0;
}

/**
 * Ładuje konfigurację estymacji WYŁĄCZNIE z secure_config poza web-rootem. Zwraca null (→ not_configured 503),
 * gdy: plik nie istnieje / nie jest zwykłym plikiem / realpath leży w web-roocie / nie zwraca tablicy /
 * brak `erp_estimate_url` / brak tokenu. Token estymacji: `erp_estimate_token` lub (fallback) `erp_token`.
 * Parametry służą wyłącznie testowalności — produkcja używa domyślnych.
 */
function estimate_load_config(?string $configFile = null, ?string $publicHtmlDir = null): ?array
{
    $configFile = $configFile ?? estimate_secure_config_path();
    if ($publicHtmlDir === null) {
        $publicHtmlDir = estimate_public_html_dir();
    } else {
        $resolved = realpath($publicHtmlDir);
        $publicHtmlDir = $resolved !== false ? $resolved : $publicHtmlDir;
    }

    if (!is_file($configFile)) {
        return null;
    }
    $real = realpath($configFile);
    if ($real === false || !is_file($real)) {
        return null;
    }
    if ($publicHtmlDir !== null && $publicHtmlDir !== '' && estimate_path_is_inside($real, $publicHtmlDir)) {
        return null;
    }

    /** @noinspection PhpIncludeInspection */
    $data = require $real;
    if (!is_array($data)) {
        return null;
    }

    // CONFIG-GATE: bez erp_estimate_url adapter pozostaje not_configured (bezpieczny domyślny stan).
    $url = (isset($data['erp_estimate_url']) && is_string($data['erp_estimate_url']))
        ? trim($data['erp_estimate_url']) : '';
    if ($url === '') {
        return null;
    }
    // Token estymacji: dedykowany (scope public_estimates:create) lub reuse tokenu leadów.
    $token = (isset($data['erp_estimate_token']) && is_string($data['erp_estimate_token']) && trim($data['erp_estimate_token']) !== '')
        ? trim($data['erp_estimate_token'])
        : ((isset($data['erp_token']) && is_string($data['erp_token'])) ? trim($data['erp_token']) : '');
    if ($token === '') {
        return null;
    }

    return [
        'erp_estimate_url' => $url,
        'erp_token' => $token,
        'request_timeout_ms' => isset($data['request_timeout_ms']) ? (int) $data['request_timeout_ms'] : 12000,
        'connect_timeout_ms' => isset($data['connect_timeout_ms']) ? (int) $data['connect_timeout_ms'] : 5000,
        'mock' => (bool) ($data['mock'] ?? false),
        'allow_mock' => (bool) ($data['allow_mock'] ?? false),
        'is_production' => (bool) ($data['is_production'] ?? true),
    ];
}

function estimate_mock_enabled(array $config): bool
{
    return ($config['mock'] ?? false) === true
        && ($config['allow_mock'] ?? false) === true
        && ($config['is_production'] ?? true) === false;
}

// ==================================================================
// WYSYŁKA DO ERP (cURL + retry) — token/adres server-only
// ==================================================================

function estimate_is_idempotency_key(string $v): bool
{
    return $v !== '' && mb_strlen($v) <= 190 && (bool) preg_match('/^[A-Za-z0-9._:\-]+$/', $v);
}

/** Payload do ERP z ZWALIDOWANYCH danych. Strukturalne `answers` (nie brief). Metadane whitelistowane. */
function estimate_build_erp_payload(array $in, string $idem): array
{
    $strOrNull = static function ($v, int $max = 1000): ?string {
        return (is_string($v) && trim($v) !== '') ? mb_substr(trim($v), 0, $max) : null;
    };

    $answers = (isset($in['answers']) && is_array($in['answers'])) ? $in['answers'] : [];
    $contactIn = (isset($in['contact']) && is_array($in['contact'])) ? $in['contact'] : [];
    $contact = array_filter([
        'name' => $strOrNull($contactIn['name'] ?? null, 200),
        'email' => $strOrNull($contactIn['email'] ?? null, 255),
        'phone' => $strOrNull($contactIn['phone'] ?? null, 50),
        'consent' => (bool) ($contactIn['consent'] ?? false),
    ], static fn ($v) => $v !== null);
    $contact['consent'] = (bool) ($contactIn['consent'] ?? false);

    $payload = [
        'idempotency_key' => $idem,
        'form_version' => $strOrNull($in['form_version'] ?? null, 40) ?? '',
        'answers' => $answers,
        'contact' => $contact,
        // Provenance — organizacja i tak wynika z tokenu po stronie ERP; to tylko metadane.
        'source' => $strOrNull($in['source'] ?? null, 120) ?? 'paneliastudio.pl/wycena',
        'landing_page' => $strOrNull($in['landing_page'] ?? null, 1000),
        'referrer' => $strOrNull($in['referrer'] ?? null, 1000),
        'submitted_at' => $strOrNull($in['submitted_at'] ?? null, 40),
    ];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $u) {
        $val = $strOrNull($in[$u] ?? null, 250);
        if ($val !== null) {
            $payload[$u] = $val;
        }
    }

    return array_filter($payload, static fn ($v) => $v !== null);
}

function estimate_build_erp_headers(string $token, string $idempotencyKey, string $correlationId): array
{
    return [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json',
        'Idempotency-Key: ' . $idempotencyKey,
        'X-Correlation-ID: ' . $correlationId,
    ];
}

function estimate_is_retryable(int $status, bool $timeout, bool $transport): bool
{
    // Uwaga: retry TYLKO dla stanów bez ryzyka utworzenia leada (transport/timeout/503/502/504/429).
    return $timeout || $transport || in_array($status, [429, 502, 503, 504], true);
}

/**
 * Zwraca ['status'=>int,'body'=>?array,'timeout'=>bool,'transport'=>bool,'attempts'=>int,'retry_after'=>?int].
 */
function estimate_send_to_erp(array $config, array $payload, string $correlationId): array
{
    if (!function_exists('curl_init')) {
        return ['status' => 0, 'body' => null, 'timeout' => false, 'transport' => true, 'attempts' => 0, 'retry_after' => null];
    }

    $url = $config['erp_estimate_url'];
    $token = $config['erp_token'];
    $connectMs = (int) ($config['connect_timeout_ms'] ?? 5000);
    $totalMs = (int) ($config['request_timeout_ms'] ?? 12000);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $headers = estimate_build_erp_headers($token, (string) $payload['idempotency_key'], $correlationId);

    $attempt = 0;
    $maxAttempts = 2;
    $last = ['status' => 0, 'body' => null, 'timeout' => false, 'transport' => false, 'attempts' => 0, 'retry_after' => null];

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

        $last = ['status' => $status, 'body' => $bodyArr, 'timeout' => $timeout, 'transport' => $transport, 'attempts' => $attempt, 'retry_after' => $retryAfter];

        if (!estimate_is_retryable($status, $timeout, $transport) || $attempt >= $maxAttempts) {
            break;
        }
        usleep($status === 429 ? (max(1, min($retryAfter ?? 1, 2)) * 1000000) : 350000);
    }

    return $last;
}

function estimate_mock_result(string $scenario): array
{
    $ok = static fn (array $body) => ['status' => 200, 'body' => $body, 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null];

    return match ($scenario) {
        'estimate' => ['status' => 201, 'body' => ['ok' => true, 'status' => 'created', 'lead_id' => 4242, 'lead_delivered' => true, 'result' => ['type' => 'estimate', 'mode' => 'internal_engine', 'message' => 'Wstępna wycena.', 'components' => []], 'correlation_id' => 'mock'], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null],
        'duplicate' => $ok(['ok' => true, 'duplicate' => true, 'idempotent' => true, 'status' => 'duplicate', 'lead_id' => 4242, 'lead_delivered' => true, 'result' => ['type' => 'manual_quote', 'mode' => 'external_quote', 'message' => 'Przyjęto.', 'components' => []]]),
        '422' => ['status' => 422, 'body' => ['ok' => false, 'status' => 'validation_error', 'errors' => ['contact.email' => ['Nieprawidłowy e-mail.']]], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null],
        '401' => ['status' => 401, 'body' => ['ok' => false, 'status' => 'error'], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null],
        '429' => ['status' => 429, 'body' => ['ok' => false, 'status' => 'error'], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => 2],
        '503' => ['status' => 503, 'body' => ['ok' => false], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null],
        '500' => ['status' => 500, 'body' => ['ok' => false], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null],
        'timeout' => ['status' => 0, 'body' => null, 'timeout' => true, 'transport' => true, 'attempts' => 2, 'retry_after' => null],
        default => ['status' => 201, 'body' => ['ok' => true, 'status' => 'created', 'duplicate' => false, 'lead_id' => 4242, 'lead_delivered' => true, 'result' => ['type' => 'manual_quote', 'mode' => 'external_quote', 'message' => 'Przyjęto konfigurację.', 'components' => []], 'correlation_id' => 'mock'], 'timeout' => false, 'transport' => false, 'attempts' => 1, 'retry_after' => null],
    };
}

/**
 * Mapuje wynik ERP na bezpieczną odpowiedź do przeglądarki, zgodną z src/lib/estimate.ts.
 *   2xx + ok=true          → 200 { ok:true, result, lead_id, lead_delivered } (TERMINAL — front bez fallbacku)
 *   422                    → 422 validation_error (front: NO fallback)
 *   401/403                → 403 forbidden       (front: NO fallback)
 *   429                    → 429 rate_limited     (front: NO fallback)
 *   503                    → 503 not_configured   (front: kontrolowany fallback — ERP nie przyjął zgłoszenia)
 *   5xx / timeout / transport → 502 error         (front: server_error — NO fallback; unik duplikatu leada)
 *   inne 4xx               → status error         (front: client_error — NO fallback)
 */
function estimate_map_result(array $result, string $requestId): void
{
    $status = (int) $result['status'];
    $body = is_array($result['body'] ?? null) ? $result['body'] : null;

    // Transport/timeout — ERP mogło już utworzyć leada; NIE dajemy fallbacku (unik duplikatu). Retry po stronie klienta.
    if ($status === 0 || ($result['timeout'] ?? false) || ($result['transport'] ?? false)) {
        estimate_json(502, ['ok' => false, 'result_type' => 'error', 'message' => 'Usługa chwilowo niedostępna. Spróbuj ponownie za chwilę.', 'request_id' => $requestId]);
    }

    // Sukces ERP.
    if ($status >= 200 && $status < 300 && is_array($body) && ($body['ok'] ?? null) === true) {
        $leadDelivered = ($body['lead_delivered'] ?? null) === true || isset($body['lead_id']);
        $erpResult = (isset($body['result']) && is_array($body['result'])) ? $body['result'] : ['type' => 'manual_quote'];
        estimate_json(200, [
            'ok' => true,
            'result_type' => is_string($erpResult['type'] ?? null) ? $erpResult['type'] : 'manual_quote',
            'result' => $erpResult,
            'lead_id' => $body['lead_id'] ?? null,
            'lead_delivered' => $leadDelivered,
            'request_id' => $requestId,
        ]);
    }

    if ($status === 422) {
        estimate_json(422, ['ok' => false, 'result_type' => 'error', 'message' => 'Sprawdź poprawność wprowadzonych informacji.', 'request_id' => $requestId]);
    }
    if ($status === 401 || $status === 403) {
        estimate_json(403, ['ok' => false, 'result_type' => 'error', 'message' => 'Usługa chwilowo niedostępna.', 'request_id' => $requestId]);
    }
    if ($status === 429) {
        $ra = (int) ($result['retry_after'] ?? 0);
        if ($ra > 0 && !headers_sent()) {
            header('Retry-After: ' . $ra);
        }
        estimate_json(429, ['ok' => false, 'result_type' => 'error', 'message' => 'Wysłano zbyt wiele zgłoszeń. Spróbuj ponownie za chwilę.', 'request_id' => $requestId]);
    }
    if ($status === 503) {
        // ERP estymator niedostępny / nie przyjął zgłoszenia → bezpieczny not_configured (kontrolowany fallback).
        estimate_json(503, ['ok' => false, 'result_type' => 'not_configured', 'message' => 'Kalkulacja wyceny jest chwilowo niedostępna. Przygotujemy wycenę indywidualnie.', 'request_id' => $requestId]);
    }
    if ($status >= 500) {
        estimate_json(502, ['ok' => false, 'result_type' => 'error', 'message' => 'Usługa chwilowo niedostępna. Spróbuj ponownie za chwilę.', 'request_id' => $requestId]);
    }

    // Inne 4xx → neutralny błąd (front: client_error, bez fallbacku).
    estimate_json($status >= 400 && $status < 500 ? $status : 502, ['ok' => false, 'result_type' => 'error', 'message' => 'Nie udało się przygotować wyceny.', 'request_id' => $requestId]);
}

// ==================================================================
// GŁÓWNA OBSŁUGA ŻĄDANIA
// ==================================================================

function estimate_main(): void
{
$requestId = estimate_correlation_id();

// Tylko POST.
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') {
    header('Allow: POST');
    estimate_json(405, ['ok' => false, 'result_type' => 'error', 'message' => 'Metoda niedozwolona.', 'request_id' => $requestId]);
}

// Origin (same-origin) — obcy Origin odrzucamy; brak Origin nie blokuje.
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$allowedOrigins = ['https://paneliastudio.pl', 'https://www.paneliastudio.pl'];
if (is_string($origin) && $origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    estimate_json(403, ['ok' => false, 'result_type' => 'error', 'message' => 'Żądanie odrzucone.', 'request_id' => $requestId]);
}

// Wymagany JSON + limit rozmiaru.
$ctype = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (strpos($ctype, 'application/json') === false) {
    estimate_json(415, ['ok' => false, 'result_type' => 'error', 'message' => 'Wymagany format JSON.', 'request_id' => $requestId]);
}
$raw = file_get_contents('php://input', false, null, 0, PANELIA_ESTIMATE_MAX_BODY + 1);
if ($raw === false || strlen($raw) > PANELIA_ESTIMATE_MAX_BODY) {
    estimate_json(413, ['ok' => false, 'result_type' => 'error', 'message' => 'Żądanie jest zbyt duże.', 'request_id' => $requestId]);
}
$in = json_decode($raw === '' ? 'null' : $raw, true);
if (!is_array($in)) {
    estimate_json(400, ['ok' => false, 'result_type' => 'error', 'message' => 'Nieprawidłowe dane żądania.', 'request_id' => $requestId]);
}

// —— CONFIG-GATE —— Konfiguracja ERP wyłącznie z secure_config poza web-rootem.
// Brak `erp_estimate_url` → not_configured (bezpieczny domyślny stan; frontend zrobi fallback do /api/contact).
$config = estimate_load_config();
if ($config === null) {
    estimate_json(503, [
        'ok' => false,
        'result_type' => 'not_configured',
        'message' => 'Kalkulacja wyceny nie jest jeszcze dostępna online. Przygotujemy wycenę indywidualnie.',
        'request_id' => $requestId,
    ]);
}

// Idempotency key: frontend generuje i przekazuje ten sam przez retry; serwer awaryjnie uzupełnia.
$idem = is_string($in['idempotency_key'] ?? null) ? trim($in['idempotency_key']) : '';
if (!estimate_is_idempotency_key($idem)) {
    $idem = estimate_request_id();
}

$payload = estimate_build_erp_payload($in, $idem);

// MOCK — wyłącznie przy jawnej konfiguracji prywatnej (mock+allow_mock+!is_production) — do lokalnego E2E.
if (estimate_mock_enabled($config)) {
    $scenario = is_string($in['mock_scenario'] ?? null) ? $in['mock_scenario'] : 'manual_quote';
    estimate_map_result(estimate_mock_result($scenario), $requestId);
}

// WYSYŁKA DO ERP + mapowanie odpowiedzi.
estimate_map_result(estimate_send_to_erp($config, $payload, $requestId), $requestId);
}

// Uruchom obsługę żądania, chyba że plik jest ładowany do testów jednostkowych (tylko definicje funkcji).
if (!defined('PANELIA_ESTIMATE_NO_MAIN')) {
    estimate_main();
}
