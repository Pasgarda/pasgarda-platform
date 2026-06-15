<?php
echo "Starting autoload...\n";
require __DIR__.'/../vendor/autoload.php';
echo "Autoload OK\n";
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
define('LARAVEL_START', microtime(true));
echo "Defined LARAVEL_START\n";
echo "Loading bootstrap/app.php...\n";
$app = require_once __DIR__.'/../bootstrap/app.php';
echo "Bootstrap OK\n";
echo "DONE\n";
