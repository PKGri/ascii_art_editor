<?php
require_once 'db.php';

$db = new Db();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $query = "SELECT * FROM users WHERE email = ?";
    $stmt = $db->getConnection()->prepare($query);
    $stmt->execute([$email]);

    if ($row = $stmt->fetch()) {
        if (password_verify($password, $row['password'])) {
            session_start();
            $_SESSION['user_id'] = $row['user_id'];
            $_SESSION['email'] = $row['email'];

            echo json_encode(["message" => "Влизането успешно"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Невалиден имейл или парола"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Невалиден имейл или парола"]);
    }
}
?>
