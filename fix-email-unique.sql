-- Очистка дублирующихся записей супервизоров
-- Оставляем только запись с наименьшим ID для каждого email

DELETE FROM admins 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM admins 
    WHERE email = 'tatyanamixx@gmail.com' AND role = 'SUPERVISOR'
    GROUP BY email
);

-- Добавляем уникальный индекс на поле email
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique ON admins(email);

-- Проверяем результат
SELECT id, email, role, is_2fa_enabled, name 
FROM admins 
WHERE email = 'tatyanamixx@gmail.com' AND role = 'SUPERVISOR'; 