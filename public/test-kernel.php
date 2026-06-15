<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
define('LARAVEL_START', microtime(true));
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
echo "Bootstrap OK\n";

// Try to get the kernel
try {
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    echo "Kernel resolved\n";
} catch (Exception $e) {
    echo "Kernel error: " . $e->getMessage() . "\n";
    exit;
}

echo "BEFORE handle\n";
flush();
try {
    $request = Illuminate\Http\Request::capture();
    echo "Request captured\n";
    $response = $kernel->handle($request);
    echo "AFTER handle\n";
} catch (Exception $e) {
    echo "Handle error: " . $e->getMessage() . "\n";
}
