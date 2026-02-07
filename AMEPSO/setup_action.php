<?php
/**
 * AMEPSO E-Wallet Setup Action Handler
 * Processes database installation
 */

header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    $data = $_POST;
}

switch ($action) {
    case 'test_connection':
        testConnection($data);
        break;
    case 'install':
        installDatabase($data);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

/**
 * Test database connection
 */
function testConnection($data) {
    $host = $data['host'] ?? 'localhost';
    $user = $data['user'] ?? 'root';
    $pass = $data['pass'] ?? '';
    $name = $data['name'] ?? 'amepso_wallet';

    $conn = new mysqli($host, $user, $pass);

    if ($conn->connect_error) {
        echo json_encode([
            'success' => false,
            'message' => 'Connection failed: ' . $conn->connect_error
        ]);
        return;
    }

    echo json_encode(['success' => true, 'message' => 'Connection successful']);
    $conn->close();
}

/**
 * Install database and tables
 */
function installDatabase($data) {
    $host = $data['host'] ?? 'localhost';
    $user = $data['user'] ?? 'root';
    $pass = $data['pass'] ?? '';
    $db_name = $data['name'] ?? 'amepso_wallet';

    // Connect to MySQL
    $conn = new mysqli($host, $user, $pass);

    if ($conn->connect_error) {
        echo json_encode([
            'success' => false,
            'message' => 'Connection failed: ' . $conn->connect_error
        ]);
        return;
    }

    // Create database
    $sql_db = "CREATE DATABASE IF NOT EXISTS `{$db_name}`";
    if (!$conn->query($sql_db)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create database: ' . $conn->error
        ]);
        $conn->close();
        return;
    }

    // Select database
    $conn->select_db($db_name);

    // Read and execute schema
    $schema_file = __DIR__ . '/database.sql';
    
    if (!file_exists($schema_file)) {
        echo json_encode([
            'success' => false,
            'message' => 'database.sql file not found'
        ]);
        $conn->close();
        return;
    }

    $sql = file_get_contents($schema_file);
    
    // Split by semicolon and execute each statement
    $statements = explode(';', $sql);
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            if (!$conn->query($statement)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'SQL Error: ' . $conn->error . ' | Statement: ' . substr($statement, 0, 100)
                ]);
                $conn->close();
                return;
            }
        }
    }

    // Create lock file
    file_put_contents(__DIR__ . '/installed.lock', date('Y-m-d H:i:s'));

    // Update db.php config
    $config_content = "<?php
/**
 * AMEPSO E-Wallet Database Configuration
 */

define('DB_HOST', '{$host}');
define('DB_USER', '{$user}');
define('DB_PASS', '{$pass}');
define('DB_NAME', '{$db_name}');

// Create connection
\$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if (\$conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

// Set charset
\$conn->set_charset('utf8mb4');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

?>";

    $config_file = __DIR__ . '/api/config/db.php';
    if (file_put_contents($config_file, $config_content)) {
        echo json_encode([
            'success' => true,
            'message' => 'Database installed successfully! Configuration updated.'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Database installed, but could not update config file. Update manually: DB_HOST="' . $host . '", DB_USER="' . $user . '", DB_PASS="' . $pass . '", DB_NAME="' . $db_name . '"'
        ]);
    }

    $conn->close();
}

?>
