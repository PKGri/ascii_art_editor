<?php
require_once 'db.php';

$db = new Db();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $checkQuery = "SELECT * FROM users WHERE email = ?";
    $checkStmt = $db->getConnection()->prepare($checkQuery);
    $checkStmt->execute([$email]);

    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(["error" => "Този имейл вече е зает"]);
    } else {
        $query = "INSERT INTO users (email, password) VALUES (?, ?)";
        $stmt = $db->getConnection()->prepare($query);
        $stmt->execute([$email, $password]);

        if ($stmt->rowCount() > 0) {
            session_start();
            $_SESSION['user_id'] = $row['user_id'];
            $_SESSION['email'] = $row['email'];
            
            echo json_encode(["message" => "Успешна регистрация"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Регистрацията не е успешна"]);
        }
    }
}

?>
