<?php

declare(strict_types=1);

/**
 * Panelia Studio — Estimate Gateway (adapter estymacji Fatica ERP).
 *
 * STAN: estymacja/kalkulacja po stronie Fatica ERP NIE jest jeszcze wystawiona jako publiczny
 * endpoint. Dopóki tak jest, ten adapter zwraca BEZPIECZNIE `not_configured` (HTTP 503) —
 * NIGDY fałszywej ani lokalnie policzonej ceny.
 *
 * Frontend (`src/lib/estimate.ts`), otrzymawszy `not_configured`, dostarcza lead + brief
 * sprawdzonym, produkcyjnym kanałem `/api/contact` (nie budujemy drugiego systemu leadowego).
 *
 * Docelowo: tutaj powstanie proxy do ERP (POST na endpoint kalkulacji), z tokenem czytanym
 * wyłącznie z secure_config poza webrootem — analogicznie do api/contact.php. Nie umieszczaj
 * tokenów ani adresów prywatnych w tym pliku ani w bundlu klienta.
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

$requestId = estimate_request_id();

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

// —— Punkt integracji z ERP (do wdrożenia, gdy powstanie publiczny endpoint kalkulacji) ——
// if (estimate_erp_configured()) {
//     $result = estimate_call_erp($in); // token wyłącznie z secure_config poza webrootem
//     estimate_json(200, ['ok' => true, 'result' => $result, 'request_id' => $requestId]);
// }

// STAN OBECNY: brak skonfigurowanej estymacji ERP → bezpieczny not_configured (bez ceny).
estimate_json(503, [
    'ok' => false,
    'result_type' => 'not_configured',
    'message' => 'Kalkulacja wyceny nie jest jeszcze dostępna online. Przygotujemy wycenę indywidualnie.',
    'request_id' => $requestId,
]);
