<?php
    include 'db.php';

    $db = new Db();

    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        session_start();

        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(["error" => "Не сте влезли с потребител"]);
            exit();
        }

        $user_id = $_SESSION['user_id'];

        $query = "SELECT artwork_id, created_at FROM artworks WHERE user_id = ?";
        $stmt = $db->getConnection()->prepare($query);
        $stmt->execute([$user_id]);

        $artworks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($artworks);
    }
?>