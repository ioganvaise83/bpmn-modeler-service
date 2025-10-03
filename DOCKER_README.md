# BPMN Modeler Service - Docker Setup

Этот проект теперь поддерживает запуск через Docker Compose. Проект состоит из трех сервисов:

- **Frontend**: BPMN модельер на базе bpmn-js
- **Backend**: Go сервер для работы с диаграммами
- **Nginx**: Reverse proxy для маршрутизации запросов

## Структура проекта

```
├── src/                 # Исходный код клиентской части
├── server/              # Go сервер
├── public/              # Скомпилированные файлы (генерируется автоматически)
├── resources/           # BPMN ресурсы
└── docker-compose.yml   # Конфигурация Docker Compose
```

## Быстрый запуск

1. **Собрать и запустить все сервисы:**
   ```bash
   docker-compose up --build
   ```

2. **Открыть приложение:**
   - Перейдите по адресу: http://localhost
   - Приложение будет доступно на порту 80

## Управление сервисами

### Запуск в фоновом режиме
```bash
docker-compose up -d --build
```

### Остановка сервисов
```bash
docker-compose down
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nginx
```

### Перезапуск сервиса
```bash
docker-compose restart frontend
```

## Архитектура

### Frontend Service
- **Базовый образ**: node:18-alpine (для сборки) + nginx:alpine (для сервинга)
- **Порт**: 80 (внутри контейнера)
- **Функция**: Собирает клиентскую часть с помощью webpack и раздает статические файлы

### Backend Service
- **Базовый образ**: golang:1.21-alpine (для сборки) + alpine (для запуска)
- **Порт**: 8081
- **Функция**: Обрабатывает API запросы для сохранения/загрузки BPMN диаграмм

### Nginx Service
- **Базовый образ**: nginx:alpine
- **Порт**: 80 (внешний)
- **Функция**: Маршрутизирует запросы между frontend и backend сервисами

## API Endpoints

Backend сервис предоставляет следующие эндпоинты:

- `GET /diagram` - Получить текущую диаграмму
- `POST /diagram` - Сохранить диаграмму

## Разработка

### Локальная разработка с Docker

Для разработки с горячей перезагрузкой используйте volume mounts:

```bash
docker-compose up --build -d

# В другом терминале следите за изменениями
docker-compose logs -f frontend
```

### Локальная разработка без Docker

Если вы предпочитаете разрабатывать локально:

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск Go сервера
cd server && go run main.go
```

## Мониторинг

### Health checks

Проверить статус приложения:
```bash
curl http://localhost/health
```

### Логи контейнеров

```bash
# В реальном времени
docker-compose logs -f

# С фильтром по времени
docker-compose logs --since 1h
```

## Troubleshooting

### Проблемы с сборкой

1. **Очистить Docker cache:**
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

2. **Проверить логи сборки:**
   ```bash
   docker-compose build --progress=plain
   ```

### Проблемы с запуском

1. **Проверить порты:**
   ```bash
   netstat -tulpn | grep :80
   netstat -tulpn | grep :8081
   ```

2. **Проверить статус контейнеров:**
   ```bash
   docker-compose ps
   ```

3. **Посмотреть детальные логи:**
   ```bash
   docker-compose logs --tail=100
   ```

## Производительность

- Образы используют multi-stage сборку для уменьшения размера
- Nginx настроен для эффективного кеширования статических файлов
- Go сервер запускается от непривилегированного пользователя

## Безопасность

- Контейнеры запускаются от непривилегированных пользователей
- Нет лишних пакетов в финальных образах
- CORS настроен только для необходимых эндпоинтов
