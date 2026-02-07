<?php
/**
 * AMEPSO E-Wallet Installation & Setup Script
 * Run this file once to initialize the database
 * Access: http://localhost/amepso/setup.php
 */

// Check if already installed
if (file_exists(__DIR__ . '/installed.lock')) {
    die('<h2>✓ Installation Complete</h2><p>The AMEPSO E-Wallet is already set up. Delete <code>installed.lock</code> file to reset.</p>');
}

// Database connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'amepso_wallet';

// Error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMEPSO E-Wallet Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #FF8C42, #A0438D);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #FF8C42;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .config-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .config-item {
            margin-bottom: 15px;
        }
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        input:focus {
            outline: none;
            border-color: #FF8C42;
            box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.1);
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }
        button {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-install {
            background: linear-gradient(135deg, #FF8C42, #FF6B6B);
            color: white;
        }
        .btn-install:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255, 140, 66, 0.3);
        }
        .btn-test {
            background: #f0f0f0;
            color: #333;
        }
        .btn-test:hover {
            background: #e0e0e0;
        }
        .alert {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: none;
        }
        .alert.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }
        .alert.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }
        .alert.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
            display: block;
        }
        .steps {
            margin-top: 20px;
            padding: 15px;
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            border-radius: 5px;
        }
        .steps h3 {
            color: #2196F3;
            margin-bottom: 10px;
        }
        .steps ol {
            margin-left: 20px;
            color: #666;
        }
        .steps li {
            margin-bottom: 5px;
        }
        .code {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin-top: 10px;
            overflow-x: auto;
        }
        .spinner {
            display: none;
            text-align: center;
            margin: 10px 0;
        }
        .spinner.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏦 AMEPSO E-Wallet</h1>
        <p class="subtitle">Installation & Database Setup</p>

        <div id="alert-container"></div>

        <form id="setupForm">
            <div class="config-section">
                <h3 style="color: #333; margin-bottom: 15px;">Database Configuration</h3>

                <div class="config-item">
                    <label for="db_host">Database Host</label>
                    <input type="text" id="db_host" name="db_host" value="localhost" required>
                </div>

                <div class="config-item">
                    <label for="db_user">Database User</label>
                    <input type="text" id="db_user" name="db_user" value="root" required>
                </div>

                <div class="config-item">
                    <label for="db_pass">Database Password</label>
                    <input type="password" id="db_pass" name="db_pass" placeholder="Leave empty if no password">
                </div>

                <div class="config-item">
                    <label for="db_name">Database Name</label>
                    <input type="text" id="db_name" name="db_name" value="amepso_wallet" required>
                </div>
            </div>

            <div class="spinner" id="spinner">
                <p>Setting up database... Please wait...</p>
            </div>

            <div class="button-group">
                <button type="button" class="btn-test" onclick="testConnection()">Test Connection</button>
                <button type="submit" class="btn-install">Install Database</button>
            </div>
        </form>

        <div class="steps">
            <h3>📋 After Installation:</h3>
            <ol>
                <li>Update <code>api/config/db.php</code> with your database credentials</li>
                <li>Delete this <code>setup.php</code> file or the <code>installed.lock</code> file</li>
                <li>Access the AMEPSO E-Wallet application</li>
                <li>Create an account and start managing your electricity bills</li>
            </ol>
        </div>
    </div>

    <script>
        function showAlert(message, type) {
            const container = document.getElementById('alert-container');
            const alert = document.createElement('div');
            alert.className = `alert ${type}`;
            alert.textContent = message;
            container.innerHTML = '';
            container.appendChild(alert);
        }

        function testConnection() {
            const host = document.getElementById('db_host').value;
            const user = document.getElementById('db_user').value;
            const pass = document.getElementById('db_pass').value;
            const name = document.getElementById('db_name').value;

            fetch('setup_action.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'test_connection',
                    host, user, pass, name
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showAlert('✓ Database connection successful!', 'success');
                } else {
                    showAlert('✗ Connection failed: ' + data.message, 'error');
                }
            })
            .catch(err => showAlert('✗ Error: ' + err.message, 'error'));
        }

        document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const host = document.getElementById('db_host').value;
            const user = document.getElementById('db_user').value;
            const pass = document.getElementById('db_pass').value;
            const name = document.getElementById('db_name').value;

            document.getElementById('spinner').classList.add('active');

            try {
                const response = await fetch('setup_action.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'install',
                        host, user, pass, name
                    })
                });

                const data = await response.json();
                document.getElementById('spinner').classList.remove('active');

                if (data.success) {
                    showAlert('✓ Installation complete! You can now delete this setup file.', 'success');
                    document.getElementById('setupForm').style.display = 'none';
                } else {
                    showAlert('✗ Installation failed: ' + data.message, 'error');
                }
            } catch (err) {
                document.getElementById('spinner').classList.remove('active');
                showAlert('✗ Error: ' + err.message, 'error');
            }
        });
    </script>
</body>
</html>
