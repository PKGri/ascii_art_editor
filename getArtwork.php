<?php
    include 'db.php';

    $db = new Db();

    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $artwork_id = $_GET['artwork_id'];

        $query = "SELECT content FROM artworks WHERE artwork_id = ?";
        $stmt = $db->getConnection()->prepare($query);
        $stmt->execute([$artwork_id]);

        $artwork = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($artwork) {
            echo json_encode($artwork);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Не е намерено произведение"]);
        }
    }
?>
