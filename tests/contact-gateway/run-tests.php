<?php

declare(strict_types=1);

// Lekki harness testowy (bez zewnętrznych zależności) dla czystych funkcji gatewaya.
// Uruchomienie: php tests/contact-gateway/run-tests.php
//
// Definiujemy PANELIA_CONTACT_TEST, aby include NIE uruchamiał obsługi żądania.
define('PANELIA_CONTACT_TEST', true);
require __DIR__ . '/../../public/api/contact.php';

$tests = 0;
$failed = 0;
function check(string $name, bool $cond): void
{
    global $tests, $failed;
    $tests++;
    if ($cond) {
        echo "  PASS  $name\n";
    } else {
        $failed++;
        echo "  FAIL  $name\n";
    }
}

$base = [
    'name' => 'Jan Kowalski',
    'email' => 'JAN@Example.COM',
    'phone' => '+48 601 000 000',
    'message' => 'Dzień dobry, proszę o kontakt w sprawie projektu wnętrza.',
    'consent' => true,
    'package_interest' => 'panelia_complete',
];

// 1. poprawne dane
$v = panelia_validate($base);
check('1 valid data -> ok', $v['ok'] === true);
check('1 email lowercased', $v['data']['email'] === 'jan@example.com');
check('7 phone preserved with plus', $v['data']['phone'] === '+48601000000');

// 2. brak name
$v = panelia_validate(['name' => '', 'email' => 'a@b.pl', 'message' => str_repeat('x', 20), 'consent' => true]);
check('2 missing name -> error', isset($v['errors']['name']) && !$v['ok']);

// 3. błędny e-mail
$v = panelia_validate(['name' => 'Anna Nowak', 'email' => 'not-an-email', 'message' => str_repeat('x', 20), 'consent' => true]);
check('3 bad email -> error', isset($v['errors']['email']));

// 4. brak message
$v = panelia_validate(['name' => 'Anna Nowak', 'email' => 'a@b.pl', 'message' => 'krótko', 'consent' => true]);
check('4 short message -> error', isset($v['errors']['message']));

// 5. consent=false
$v = panelia_validate(['name' => 'Anna Nowak', 'email' => 'a@b.pl', 'message' => str_repeat('x', 20), 'consent' => false]);
check('5 consent false -> error', isset($v['errors']['consent']));

// 6. niedozwolony pakiet
$v = panelia_validate(['name' => 'Anna Nowak', 'email' => 'a@b.pl', 'message' => str_repeat('x', 20), 'consent' => true, 'package_interest' => 'panelia_invest']);
check('6 disallowed package -> error', isset($v['errors']['package_interest']));

// 7. telefon opcjonalny
$v = panelia_validate(['name' => 'Anna Nowak', 'email' => 'a@b.pl', 'message' => str_repeat('x', 20), 'consent' => true]);
check('7 phone optional -> ok', $v['ok'] === true && $v['data']['phone'] === '');

// HTML w polach jest usuwany
$v = panelia_validate(['name' => 'Anna <b>Nowak</b>', 'email' => 'a@b.pl', 'message' => '<script>alert(1)</script> Proszę o kontakt.', 'consent' => true]);
check('strip html name', strpos($v['data']['name'], '<') === false);
check('strip html message', strpos($v['data']['message'], '<script') === false);

// 11/idempotency: format
check('11 idempotency valid', panelia_is_idempotency_key('panelia-contact-3f2504e0-4f89-41d3-9a0c-0305e82c3301'));
check('11 idempotency invalid prefix', !panelia_is_idempotency_key('other-3f2504e0-4f89-41d3-9a0c-0305e82c3301'));
check('11 idempotency invalid format', !panelia_is_idempotency_key('panelia-contact-xyz'));
$gen = panelia_make_idempotency_key();
check('11 generated idempotency matches format', panelia_is_idempotency_key($gen));

// landing_page: tylko dozwolone hosty
check('landing allowed host', panelia_landing_page('https://paneliastudio.pl/kontakt') === 'https://paneliastudio.pl/kontakt');
check('landing foreign host -> null', panelia_landing_page('https://evil.example/x') === null);
check('landing javascript -> null', panelia_landing_page('javascript:alert(1)') === null);

// safe_url: odrzuca niebezpieczne protokoły
check('safe_url data -> null', panelia_safe_url('data:text/html,x') === null);
check('safe_url https ok', panelia_safe_url('https://x.pl/a') === 'https://x.pl/a');

// 19/20 UTM: limit długości 255
$long = str_repeat('a', 400);
check('19 utm truncated to 255', mb_strlen((string) panelia_utm($long)) === 255);
check('19 utm empty -> null', panelia_utm('') === null);

// submitted_at: fallback czasu serwera dla błędnego
check('submitted_at fallback', is_string(panelia_iso_or_now('to-nie-data')) && strlen(panelia_iso_or_now('to-nie-data')) > 10);
check('submitted_at valid iso kept', strpos(panelia_iso_or_now('2024-01-02T03:04:05Z'), '2024-01-02') === 0);

// mask_email
check('mask email', panelia_mask_email('jan.kowalski@example.com') === 'j***@example.com');

// Sekcja 2: wyliczenie ścieżki private_html względem public/api/contact.php.
$norm = static fn(string $p): string => str_replace('\\', '/', $p);
$cfg = panelia_load_config();
$apiDir = dirname((new ReflectionFunction('panelia_load_config'))->getFileName());
$expected = $norm(dirname($apiDir, 2) . '/private_html');
check('2 private_dir = ../../private_html (poza public_html)', $norm($cfg['private_dir']) === $expected);
check('2 private_dir kończy się na /private_html', str_ends_with($norm($cfg['private_dir']), '/private_html'));
check('2 private_dir nie w public_html', strpos($norm($cfg['private_dir']), '/public_html/') === false);

// Sekcja 3: mock domyślnie wyłączony (allow_mock=false w defaultach).
check('3 mock domyślnie false', ($cfg['mock'] ?? false) === false);
check('3 allow_mock domyślnie false', ($cfg['allow_mock'] ?? false) === false);

// Sekcja 8/18/19/20: budowa payloadu do ERP.
$vd = panelia_validate($base)['data'];
$rawIn = [
    'source' => 'evil.example',              // niezaufane — ma być zignorowane
    'organization_id' => 'org-hacker',
    'organization_slug' => 'hacker',
    'notification_recipients' => ['x@evil'],
    'sender_email' => 'x@evil',
    'token' => 'FAKE',
    'landing_page' => 'https://paneliastudio.pl/kontakt?x=1',
    'referrer' => 'https://google.com/',
    'utm_source' => 'newsletter',
    'submitted_at' => '2024-05-06T07:08:09Z',
];
$pl = panelia_build_erp_payload($vd, $rawIn, 'panelia-contact-3f2504e0-4f89-41d3-9a0c-0305e82c3301');
check('18 source wymuszony paneliastudio.pl', $pl['source'] === 'paneliastudio.pl');
check('19 organization_id ignorowane', !array_key_exists('organization_id', $pl));
check('19 organization_slug ignorowane', !array_key_exists('organization_slug', $pl));
check('19 notification_recipients ignorowane', !array_key_exists('notification_recipients', $pl));
check('19 sender_email ignorowane', !array_key_exists('sender_email', $pl));
check('19 token ignorowany', !array_key_exists('token', $pl));
$documented = ['name', 'email', 'phone', 'package_interest', 'message', 'consent', 'submitted_at',
    'source', 'landing_page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
    'utm_term', 'idempotency_key'];
check('20 tylko udokumentowane pola', array_keys($pl) === $documented);
check('landing_page zachowane (własny host)', $pl['landing_page'] === 'https://paneliastudio.pl/kontakt?x=1');
check('utm_source zmapowane', $pl['utm_source'] === 'newsletter');
check('utm puste -> null', $pl['utm_term'] === null);

echo "\n";
echo "Wynik: " . ($tests - $failed) . "/$tests OK\n";
exit($failed === 0 ? 0 : 1);
