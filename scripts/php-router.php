<?php

declare(strict_types=1);

// Lokalny router dla `php -S`.
// Używany wyłącznie do kontrolowanego E2E: statyczny dist + PHP /api/contact.
// Nie zawiera tokenów ani konfiguracji ERP.

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path === '/api/contact' || $path === '/api/contact/') {
    require __DIR__ . '/../dist/api/contact.php';
    return true;
}

return false;