-- Sửa ID kênh sai (YouTube API không tìm thấy). ID đúng tra theo handle qua YouTube API.
UPDATE channels SET id = 'UCJFZiqLMntJufDCHc6bQixg' WHERE id = 'UCJFZiqLm7iJ0vEM18y4_bWw'; -- hololive
UPDATE channels SET id = 'UCRM9eq-dXhdIwZTyNmtAIug' WHERE id = 'UCuP2vJ6_0nB9H_P1o5_P3wA'; -- Vexsper
UPDATE channels SET id = 'UCoSrY_IQQVpmIRZ9Xf-y93g' WHERE id = 'UCp-9F3MEliOQ2sbAnG0OqLQ'; -- Gawr Gura
UPDATE channels SET id = 'UCCzUftO8KOVkV4wQG1vkUvg' WHERE id = 'UCCzUftO8KOVkV4wQG1vkU1g'; -- Houshou Marine
-- SBS Drama: handle @sbsdrama không tồn tại; kênh gần nhất tìm được là "SBS 스브스 Drama". Kiểm tra lại trước khi chạy:
UPDATE channels SET id = 'UC6erIDuvbOaAO-OT5rB2Xew' WHERE id = 'UC9nK195uN_z_4L0Qj7x1l0w'; -- SBS Drama
