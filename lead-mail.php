<?php
/*
 * Brand Vitals · lead e-mail notification
 * The website forms POST here (JSON) right after saving the lead to Supabase,
 * and this sends a copy to the inbox below. Runs on DreamHost; uses PHP mail(),
 * which DreamHost delivers through its own mail servers (SPF covers them).
 */

const LEAD_TO   = 'info@brandvitals.io';
const LEAD_FROM = 'noreply@brandvitals.io';
const SITE_HOST = 'brandvitals.io';
const MAX_PER_HOUR = 5;           // per visitor IP
const MAX_BODY_BYTES = 20000;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(405, ['ok' => false, 'error' => 'method']);

// Only accept submissions coming from the site's own pages.
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
if ($originHost !== SITE_HOST && $originHost !== 'www.' . SITE_HOST) reply(403, ['ok' => false, 'error' => 'origin']);

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) reply(413, ['ok' => false, 'error' => 'size']);
$in = json_decode($raw, true);
if (!is_array($in)) reply(400, ['ok' => false, 'error' => 'json']);

// Honeypot: real visitors never fill the hidden "website" field. Pretend success.
if (!empty($in['website'])) reply(200, ['ok' => true]);

function field($in, $key, $max) {
    $v = isset($in[$key]) && is_scalar($in[$key]) ? (string) $in[$key] : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    if ($v === null) $v = '';  // invalid UTF-8
    $v = trim($v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}
// Values that end up in mail headers or the subject must be single-line.
function oneLine($v) { return trim(preg_replace('/[\r\n]+/', ' ', $v)); }

$lead = [
    'name'    => oneLine(field($in, 'name', 200)),
    'email'   => oneLine(field($in, 'email', 200)),
    'phone'   => oneLine(field($in, 'phone', 60)),
    'company' => oneLine(field($in, 'company', 200)),
    'service' => oneLine(field($in, 'service', 120)),
    'budget'  => oneLine(field($in, 'budget', 120)),
    'form'    => oneLine(field($in, 'form', 60)),
    'page'    => oneLine(field($in, 'page', 300)),
    'lang'    => oneLine(field($in, 'lang', 10)),
    'message' => field($in, 'message', 5000),
];
$validEmail = filter_var($lead['email'], FILTER_VALIDATE_EMAIL) !== false;
if ($lead['name'] === '' && $lead['email'] === '' && $lead['phone'] === '') reply(422, ['ok' => false, 'error' => 'empty']);
if ($lead['email'] !== '' && !$validEmail) reply(422, ['ok' => false, 'error' => 'email']);

// Rate limit per IP, stored outside the public web root.
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$dir = dirname(__DIR__) . '/.lead-mail';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
$file = $dir . '/' . hash('sha256', 'bv|' . $ip) . '.json';
$now = time();
$hits = is_file($file) ? json_decode((string) @file_get_contents($file), true) : [];
$hits = array_values(array_filter(is_array($hits) ? $hits : [], function ($t) use ($now) { return is_int($t) && $t > $now - 3600; }));
if (count($hits) >= MAX_PER_HOUR) reply(429, ['ok' => false, 'error' => 'rate']);
$hits[] = $now;
@file_put_contents($file, json_encode($hits), LOCK_EX);

$labels = [
    'name' => 'Name / الاسم', 'email' => 'Email', 'phone' => 'Phone / الموبايل', 'company' => 'Company / الشركة',
    'service' => 'Service / الخدمة', 'budget' => 'Budget / الميزانية', 'form' => 'Form', 'page' => 'Page', 'lang' => 'Language',
];
$lines = [];
foreach ($labels as $k => $label) if ($lead[$k] !== '') $lines[] = $label . ': ' . $lead[$k];
$body = "New lead from brandvitals.io\n\n" . implode("\n", $lines)
      . ($lead['message'] !== '' ? "\n\nMessage / الرسالة:\n" . $lead['message'] : '')
      . "\n\n--\nAlso saved in the dashboard: https://brandvitals.io/dashboard.html\nSent " . gmdate('Y-m-d H:i') . " UTC\n";

$who = $lead['name'] !== '' ? $lead['name'] : ($lead['email'] !== '' ? $lead['email'] : $lead['phone']);
$subject = '=?UTF-8?B?' . base64_encode('New lead: ' . $who . ($lead['service'] !== '' ? ' — ' . $lead['service'] : '')) . '?=';
$headers = [
    'From: =?UTF-8?B?' . base64_encode('Brand Vitals Website') . '?= <' . LEAD_FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
if ($validEmail) $headers[] = 'Reply-To: ' . $lead['email'];

$sent = @mail(LEAD_TO, $subject, $body, implode("\r\n", $headers), '-f' . LEAD_FROM);
reply($sent ? 200 : 502, ['ok' => (bool) $sent]);
