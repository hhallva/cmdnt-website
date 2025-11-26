-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: cmdntdb
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NoteS=@@SQL_NoteS, SQL_NoteS=0 */;

SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `Note`;
TRUNCATE TABLE `Resettlement`;
TRUNCATE TABLE `Contact`;
TRUNCATE TABLE `Student`;
TRUNCATE TABLE `Room`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Role`;
TRUNCATE TABLE `Group`;
SET FOREIGN_KEY_CHECKS=1;

LOCK TABLES `Role` WRITE;
/*!40000 ALTER TABLE `Role` DISABLE KEYS */;
INSERT INTO `Role` VALUES (1,'Администратор'),(2,'Комендант'),(3,'Воспитатель');
/*!40000 ALTER TABLE `Role` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'Нестерова','Елена','Сергеевна','admin','$2a$11$BvKICMIl2hQnMvmn4wai3OQYG71RDX5DBDBS3dltpJkxhCWFalKhC',1),(2,'Чупова','Нина','Альбертовна','cmdnt','$2a$11$1S9ZmtoRpjbgte.mXxyu2./mf1yjXvr4Yot0cM0c2pq.9Xz.SXYqS',2),(3,'Едакина','Ольга','Вячелсавовна','vospit','$2a$11$rG4.DIBr4/gtvIxvk6FBGeTlUM.9G.ug0lqs.C7T5TtcsXg1kjqwi',3),(25,'Тестовый             ','Тестовый','Тестовый ','test','$2a$11$UgZIf29oOHO4/7yG5jhIreT1A67IQY723W0AYom2eHTWROxfa1aRy',1);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `Group` WRITE;
/*!40000 ALTER TABLE `Group` DISABLE KEYS */;
INSERT INTO `Group` VALUES (1,'ИСПП-21',4),(5,'ОИБ-41',2),(6,'ИСПВ-42',2),(7,'ИСПВ-21',3),(8,'ИСПВ-22',4),(10,'ССА-41',2);
/*!40000 ALTER TABLE `Group` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `Student` WRITE;
/*!40000 ALTER TABLE `Student` DISABLE KEYS */;
INSERT INTO `Student` VALUES (1,1,'Дружинин','Денис','Альбертович',NULL,'2006-08-29 05:00:00.000000',1,0,'Коноша'),(2,1,'Екимов','Вячеслав','Андреевич','89539323467','2005-12-12 05:00:00.000000',1,1,'г. Северодвинск'),(3,1,'Герасименко','Степан','Евгеньевич',NULL,'2006-08-24 00:00:00.000000',1,0,'Комарово'),(4,1,'Колосов','Вадим','Алексеевич','89210733512','2007-02-12 00:00:00.000000',1,0,'г. Шенкурск'),(6,5,'Сабурова','Александра','Евгеньвна',NULL,'2008-08-14 00:00:00.000000',0,0,'Архангельская обл'),(7,6,'Сапач','Диана','Вячеславовна',NULL,'2007-01-19 00:00:00.000000',0,0,'г. Северодвинск, ост. Ягры'),(8,7,'Филиппов','Сергей','Вадимович',NULL,'2006-08-03 00:00:00.000000',1,0,NULL),(9,8,'Волковский','Егор',NULL,NULL,'2006-05-22 00:00:00.000000',1,0,'г. Северодвинск'),(10,10,'Лисицинская','Октябрина','Александровна','89000000000','2008-10-31 00:00:00.000000',0,0,'Урдома'),(11,1,'Тестовый             ','Тестовый','Тестовый ','89000000002','2025-11-23 00:00:00.000000',1,0,'Тестовый');
/*!40000 ALTER TABLE `Student` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `Contact` WRITE;
/*!40000 ALTER TABLE `Contact` DISABLE KEYS */;
INSERT INTO `Contact` VALUES (58,2,'Мать','89000000000'),(59,2,'Отец','89000000000');
/*!40000 ALTER TABLE `Contact` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `Note` WRITE;
/*!40000 ALTER TABLE `Note` DISABLE KEYS */;
INSERT INTO `Note` VALUES (4,1,1,'вава','2025-10-15 00:00:00.000000'),(5,1,3,'ууукук','2025-10-15 00:00:00.000000'),(6,1,2,'вав','2025-10-15 00:00:00.000000'),(7,2,2,'АОАОАОАОА','2025-10-15 00:00:00.000000'),(8,1,2,'Молодец','2025-11-24 19:48:32.142616'),(14,2,1,'Ты огромный молодец!','2025-11-24 19:59:34.175288'),(16,2,1,'Я тут сижу значит текст пишу, какой-то длинный и вот уже почти написал предложение, чтоб протестировать чтоб будет если я сделаю переносы строк. Просто при очень длинном тексте он не переносился, а сейчас будет переноситься. \nА это начался второй абзац моего длинного текста заметки о Вячеславе и потихонечьку текста становиться все больше и БОЛЬШЕ.','2025-11-24 20:06:11.106113'),(17,2,NULL,'Тестовое сообщение от неизвестного пользователя','2025-11-24 20:06:11.106113'),(18,2,3,'Хороший мальчик','2025-11-24 21:19:08.541154'),(22,2,3,'ыывва','2025-11-24 22:48:40.257439');
/*!40000 ALTER TABLE `Note` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `Room` WRITE;
/*!40000 ALTER TABLE `Room` DISABLE KEYS */;
INSERT INTO `Room` VALUES (1,8,8,2),(3,8,3,2),(10,8,15,3),(11,6,16,2),(12,9,17,3),(28,8,1,5),(29,8,1,3),(30,8,2,2),(31,8,2,3),(32,8,3,3),(33,8,4,2),(34,8,4,3),(35,8,7,2),(36,8,7,3),(37,8,8,3),(49,8,12,3),(50,8,13,2),(51,8,13,3),(52,8,15,2),(53,8,15,3),(54,8,16,2),(55,8,16,3),(56,8,17,2),(57,8,17,3),(58,8,18,2),(59,8,18,3),(60,8,12,2);
/*!40000 ALTER TABLE `Room` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `Resettlement` WRITE;
/*!40000 ALTER TABLE `Resettlement` DISABLE KEYS */;
INSERT INTO `Resettlement` VALUES (2,1),(3,3),(4,3),(7,10),(8,11);
/*!40000 ALTER TABLE `Resettlement` ENABLE KEYS */;
UNLOCK TABLES;





/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NoteS=@OLD_SQL_NoteS */;

-- Dump completed on 2025-11-26 18:28:21
