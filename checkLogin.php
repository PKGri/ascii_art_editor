<?php
    session_start();

    if (isset($_SESSION['user_id'])) {
        echo json_encode(["logged_in" => true, "user_email" => $_SESSION['email']]);
    } else {
        echo json_encode(["logged_in" => false]);
    }
?>
