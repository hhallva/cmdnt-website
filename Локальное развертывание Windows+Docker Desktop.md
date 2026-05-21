
## 📋 Требования

- 💻 Windows 10/11 (Pro/Enterprise/Home с WSL2)
- 🐳 Docker Desktop с включённым **WSL2 бэкендом**
## Шаг 0: Подготовка

### 1. Проверить, что Docker работает

```powershell
docker --version
docker compose version
docker run --rm hello-world
```

### 2. Включи WSL2 (если ещё нет)

```powershell
# От администратора:
wsl --install
wsl --set-default-version 2
```

При необходимости перезагрузить ПК
## Шаг 1: Клонирование репозитория

```powershell
mkdir -p D:\Temp\Projects
cd D:\Temp\Projects

git clone https://github.com/hhallva/cmdnt-website.git
cd cmdnt-website
```

## Шаг 2: Настройка .env

```env
# === ОБЩИЕ ===
ASPNETCORE_ENVIRONMENT=Production или Development

# === MySQL ===
DB_HOST=db
DB_PORT=3306
DB_NAME=..
DB_USER=...
DB_PASSWORD=...
DB_ROOT_PASSWORD=..
DB_VOLUME_NAME=..

# === JWT ===
JWT_KEY=key_32_chars_min
  
# === Frontend ===
DOMAIN_NAME=yourdomain.local
VITE_API_URL=https://yourdomain.local

# === CORS ===
CORS_ORIGINS=https://yourdomain.local
FRONTEND_API_URL=https://yourdomain.local
```
JWT_KEY - необходимо придумать рандомную строку из 32 символов

## Шаг 3: Настройка локального домена
### 1. Добавление локального домена 
Необходимо открыть файл `hosts` находящийся в папке `C:\Windows\System32\drivers\etc\`
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```
### 2. Добавить строку в конец файла

```
127.0.0.1    ВАШ_ДОМЕН.local
```
### 3. Проверь, что домен резолвится

```powershell
ping ВАШ_ДОМЕН.local
```

## Шаг 4: Запуск контейнеров

```powershell
# В папке проекта:
docker compose up -d --build
```
Дождаться окончания загрузки

После завершения загрузки необходимо проверить что все контейнеры запущены при помощи команды `docker compose ps`
## Шаг 5: Доверие к сертификату
### 1. Доставка корневого сертификата Caddy
```powershell
mkdir -p .\certs
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > .\certs\caddy-root.crt
```
### 2. Установка сертификата в систему

Необходимо отрыть сертификат через проводник и нажать "Установить сертификат..."

<img width="618" height="609" alt="image" src="https://github.com/user-attachments/assets/2fb6e507-b764-4123-af34-c00e80fe0da3" />


После выбрать "Локальный компьютер" и нажать "Далее"

<img width="534" height="522" alt="image" src="https://github.com/user-attachments/assets/99a7f0f2-6922-4bae-bea7-891ab039aeb0" />


Выбираем "Поместить все сертификаты в следующее хранилище", после при помощи "Обзор" выбрать "Доверенные корневые центры сертификации и нажать "Далее"

<img width="535" height="517" alt="image" src="https://github.com/user-attachments/assets/224f5edd-8e46-4c8f-8dd9-df432f49d7fc" />


Нажимаем "Готово"

<img width="526" height="515" alt="image" src="https://github.com/user-attachments/assets/3b234fe2-da9e-4352-8ff9-e8897cd57f9d" />


### 3. Перезапуск браузера полностью

Необходимо закрыть **все** окна Chrome/Edge, и открыть снова.

### 4. Проверка

Требуется открыть `https://ВАШ_ДОМЕН.local` и проверить что браузер не ругается что сайт опасен

## Шаг 6: Импорт данных в БД

 Через phpMyAdmin
1. Открыть `http://localhost:8081`
2. Логин: `root`, пароль: из `.env` (`DB_ROOT_PASSWORD`)
3. Выбрать БД → вкладка "Импорт" → загрузить `.sql`
