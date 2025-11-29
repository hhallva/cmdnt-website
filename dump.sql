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
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contact`
--

DROP TABLE IF EXISTS `contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` int NOT NULL,
  `Comment` varchar(300) NOT NULL,
  `Phone` varchar(15) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Contact_StudentId` (`StudentId`),
  CONSTRAINT `FK_Contact_Student` FOREIGN KEY (`StudentId`) REFERENCES `student` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact`
--

LOCK TABLES `contact` WRITE;
/*!40000 ALTER TABLE `contact` DISABLE KEYS */;
INSERT INTO `contact` VALUES (58,2,'Мать','89000000000'),(59,2,'Отец','89000000000'),(61,56,'Молодой человек','89539323467');
/*!40000 ALTER TABLE `contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(20) NOT NULL,
  `Course` int NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group`
--

LOCK TABLES `group` WRITE;
/*!40000 ALTER TABLE `group` DISABLE KEYS */;
INSERT INTO `group` VALUES (1,'ИСПП-21',4),(5,'ОИБ-41',2),(6,'ИСПВ-42',2),(7,'ИСПВ-21',3),(8,'ИСПВ-22',4),(10,'ССА-41',2);
/*!40000 ALTER TABLE `group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note`
--

DROP TABLE IF EXISTS `note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` int NOT NULL,
  `UserId` int DEFAULT NULL,
  `Text` varchar(500) NOT NULL,
  `CreateDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Note_StudentId` (`StudentId`),
  KEY `IX_Note_UserId` (`UserId`),
  CONSTRAINT `FK_Note_Student` FOREIGN KEY (`StudentId`) REFERENCES `student` (`Id`),
  CONSTRAINT `FK_Note_User` FOREIGN KEY (`UserId`) REFERENCES `user` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note`
--

LOCK TABLES `note` WRITE;
/*!40000 ALTER TABLE `note` DISABLE KEYS */;
INSERT INTO `note` VALUES (4,1,1,'вава','2025-10-15 00:00:00.000000'),(5,1,3,'ууукук','2025-10-15 00:00:00.000000'),(6,1,2,'вав','2025-10-15 00:00:00.000000'),(7,2,2,'АОАОАОАОА','2025-10-15 00:00:00.000000'),(8,1,2,'Молодец','2025-11-24 19:48:32.142616'),(14,2,1,'Ты огромный молодец!','2025-11-24 19:59:34.175288'),(16,2,1,'Я тут сижу значит текст пишу, какой-то длинный и вот уже почти написал предложение, чтоб протестировать чтоб будет если я сделаю переносы строк. Просто при очень длинном тексте он не переносился, а сейчас будет переноситься. \nА это начался второй абзац моего длинного текста заметки о Вячеславе и потихонечьку текста становиться все больше и БОЛЬШЕ.','2025-11-24 20:06:11.106113'),(17,2,NULL,'Тестовое сообщение от неизвестного пользователя','2025-11-24 20:06:11.106113'),(18,2,3,'Хороший мальчик','2025-11-24 21:19:08.541154'),(22,2,3,'ыывва','2025-11-24 22:48:40.257439'),(28,3,1,'ы','2025-11-27 22:18:46.966392'),(29,3,1,'ы','2025-11-27 22:18:49.258037'),(30,3,1,'ы','2025-11-27 22:18:51.016385'),(31,4,3,'ввк','2025-11-28 20:22:23.420388'),(32,4,3,'уык','2025-11-28 20:22:26.040476'),(33,9,1,'ff','2025-11-28 21:51:19.179925'),(34,9,1,'waewe','2025-11-28 21:51:22.732756'),(35,1,26,'123','2025-11-28 22:04:38.331147');
/*!40000 ALTER TABLE `note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resettlement`
--

DROP TABLE IF EXISTS `resettlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resettlement` (
  `StudentId` int NOT NULL,
  `RoomId` int NOT NULL,
  PRIMARY KEY (`StudentId`,`RoomId`),
  KEY `IX_Resettlement_RoomId` (`RoomId`),
  CONSTRAINT `FK_Resettlement_Room` FOREIGN KEY (`RoomId`) REFERENCES `room` (`Id`),
  CONSTRAINT `FK_Resettlement_Student` FOREIGN KEY (`StudentId`) REFERENCES `student` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resettlement`
--

LOCK TABLES `resettlement` WRITE;
/*!40000 ALTER TABLE `resettlement` DISABLE KEYS */;
INSERT INTO `resettlement` VALUES (2,1),(3,3),(4,3),(7,10),(8,11),(11,28),(9,65),(6,71),(10,71),(57,75);
/*!40000 ALTER TABLE `resettlement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(13) NOT NULL DEFAULT 'Воспитатель',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'Администратор'),(2,'Комендант'),(3,'Воспитатель');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `FloorNumber` int NOT NULL,
  `Room` int NOT NULL,
  `Capacity` int NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (1,8,8,2),(3,8,3,2),(10,8,15,3),(11,6,16,2),(28,8,1,5),(29,8,1,3),(30,8,2,2),(31,8,2,3),(32,8,3,3),(33,8,4,2),(34,8,4,3),(35,8,7,2),(36,8,7,3),(49,8,12,3),(50,8,13,2),(51,8,13,3),(52,8,15,2),(53,8,15,3),(54,8,16,2),(55,8,16,3),(56,8,17,2),(57,8,17,3),(59,8,18,3),(60,8,12,2),(62,8,18,2),(65,9,5,2),(66,9,5,3),(71,7,13,2),(72,7,13,3),(73,6,16,5),(75,2,21,2),(76,8,8,3),(77,2,1,2);
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `GroupId` int NOT NULL,
  `Surname` varchar(100) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Patronymic` varchar(100) DEFAULT NULL,
  `Phone` varchar(15) DEFAULT NULL,
  `Birthday` datetime(6) DEFAULT NULL,
  `Gender` tinyint(1) NOT NULL,
  `IsHeadman` tinyint(1) NOT NULL,
  `Origin` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Student_GroupId` (`GroupId`),
  CONSTRAINT `FK_Student_Group` FOREIGN KEY (`GroupId`) REFERENCES `group` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (1,1,'Дружинин','Денис','Альбертович',NULL,'2006-08-29 05:00:00.000000',1,0,'Коноша'),(2,1,'Екимов','Вячеслав','Андреевич','89539323467','2005-12-12 05:00:00.000000',1,1,'г. Северодвинск'),(3,1,'Герасименко','Степан','Евгеньевич',NULL,'2006-08-24 00:00:00.000000',1,0,'Комарово'),(4,1,'Колосов','Вадим','Алексеевич','89210733512','2007-02-12 00:00:00.000000',1,0,'г. Шенкурск'),(6,5,'Сабурова','Александра','Евгеньвна',NULL,'2008-08-14 00:00:00.000000',0,0,'Архангельская обл'),(7,6,'Сапач','Диана','Вячеславовна',NULL,'2007-01-19 00:00:00.000000',0,0,'г. Северодвинск, ост. Ягры'),(8,7,'Филиппов','Сергей','Вадимович',NULL,'2006-08-03 00:00:00.000000',1,0,NULL),(9,8,'Волковский','Егор',NULL,NULL,'2006-05-22 00:00:00.000000',1,0,'г. Северодвинск'),(10,10,'Лисицинская','Октябрина','Александровна','89000000000','2008-10-31 00:00:00.000000',0,0,'Урдома'),(11,1,'Тестовый             ','Тестовый','Тестовый ','89000000002','2025-11-23 00:00:00.000000',1,0,'Тестовый'),(56,1,'Ушакова','Александра','Романовна','89040061499','2003-04-19 00:00:00.000000',0,0,'Кудрово'),(57,10,'Иванов','Иван','Иванович','89000000000','2002-12-07 00:00:00.000000',1,0,'г. Пермь');
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Surname` varchar(100) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Patronymic` varchar(100) DEFAULT NULL,
  `Login` varchar(100) NOT NULL,
  `HashPassword` varchar(255) NOT NULL,
  `RoleId` int NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_User_RoleId` (`RoleId`),
  CONSTRAINT `FK_User_Role` FOREIGN KEY (`RoleId`) REFERENCES `role` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Нестерова','Елена','Сергеевна','admin','$2a$11$BvKICMIl2hQnMvmn4wai3OQYG71RDX5DBDBS3dltpJkxhCWFalKhC',1),(2,'Чупова','Нина','Альбертовна','cmdnt','$2a$11$1S9ZmtoRpjbgte.mXxyu2./mf1yjXvr4Yot0cM0c2pq.9Xz.SXYqS',2),(3,'Едакина','Ольга','Вячелсавовна','vospit','$2a$11$rG4.DIBr4/gtvIxvk6FBGeTlUM.9G.ug0lqs.C7T5TtcsXg1kjqwi',3),(26,'Тестовый','Тестовый','Тестовый','testtest','$2a$11$xW5ETN8WTRozGUm7Zf6lvOfvI4aplMQr5eIpVvr2s13C6pVPv3uru',1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-29 22:56:22
