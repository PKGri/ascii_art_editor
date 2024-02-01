<?php
    include 'db.php';

    $db = new Db();

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        session_start();

        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Не сте влезли с потребител"]);
            exit();
        }

        $user_id = $_SESSION['user_id'];
        $content = $_POST['content'];

        $query = "INSERT INTO artworks (user_id, content) VALUES (?, ?)";
        $stmt = $db->getConnection()->prepare($query);
        $stmt->execute([$user_id, $content]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Произведениято Ви е запазено!"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Произведението не е запазено"]);
        }
    }
?>
