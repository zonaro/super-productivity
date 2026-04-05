<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use App\Database;

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$app = AppFactory::create();

$app->get('/ping', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode(['pong' => true]));
    return $response->withHeader('Content-Type', 'application/json');
});

// Exemplo de endpoint para listar tarefas
$app->get('/tasks', function (Request $request, Response $response) {
    $db = new Database();
    $pdo = $db->getPdo();
    $stmt = $pdo->query('SELECT * FROM tasks');
    $tasks = $stmt->fetchAll();
    $response->getBody()->write(json_encode($tasks));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();
