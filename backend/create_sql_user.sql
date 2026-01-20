-- Создание SQL пользователя для DataGrip
USE master;
GO

-- Создаем login
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'igniteuser')
BEGIN
    CREATE LOGIN igniteuser WITH PASSWORD = 'Ignite123!';
END
GO

-- Переключаемся на нашу базу
USE IgniteDB;
GO

-- Создаем пользователя в базе
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'igniteuser')
BEGIN
    CREATE USER igniteuser FOR LOGIN igniteuser;
    ALTER ROLE db_owner ADD MEMBER igniteuser;
END
GO
