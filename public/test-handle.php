<?php
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
define('LARAVEL_START', microtime(true));
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
echo "Before handleRequest\n";
flush();
ob_flush();
try {
    $response = $app->handleRequest(Request::capture());
    echo "After handleRequest: ".$response->getStatusCode()."\n";
} catch (Exception $e) {
    echo "Exception: ".$e->getMessage()."\n";
}
