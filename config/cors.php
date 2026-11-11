<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'lms/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*',"http://localhost:3000",'http://localhost:5173','https://ispau.ug','https://app.ispau.ug'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];

