📘 BPMN Modeler

> **Примечание**: Этот проект является форком [bpmn-io/bpmn-js-examples](https://github.com/bpmn-io/bpmn-js-examples)

Интерактивный BPMN-редактор, реализованный с использованием bpmn-js. Позволяет:

Загружать и редактировать BPMN-схемы

Сохранять схемы на сервер

Загружать схемы с сервера

Экспортировать схемы в .bpmn и .svg

Поддерживает drag-and-drop загрузку файлов

🗂 Структура проекта
csharp
Копировать
Редактировать
.
├── src/                # Исходный код frontend-приложения
│   ├── app.js
│   ├── style.css
│   ├── index.html
│   └── resources/
│       └── newDiagram.bpmn
├── public/             # Сюда Webpack собирает финальную сборку
│   ├── app.js
│   └── index.html
├── server/             # Go-сервер для раздачи статики
│   └── main.go
├── webpack.config.js   # Конфигурация Webpack
├── package.json        # NPM зависимости и скрипты
└── README.md           # Документация проекта
🚀 Быстрый старт
1. Установка зависимостей
```bash
npm install
```
2. Запуск в режиме разработки
```bash
npm run dev
```
Откроется браузер по адресу:
📂 http://localhost:8080 (или другой, если порт занят)

В этом режиме работает Webpack Dev Server — проект автоматически пересобирается при изменениях.

3. Сборка проекта (production)
```bash
npm run build
```
Сборка будет сохранена в папку public/. Она содержит:

index.html

app.js

другие ассеты

4. Запуск backend-сервера (на Go)
📍 Пререквизит:
Установлен Go

✅ Команда запуска:
```bash
cd server
go run main.go
```
После запуска открой браузер:
🌐 http://localhost:8080

Сервер раздаёт содержимое папки public/.

🔘 Функциональность
Функция	Описание
📂 Загрузка схемы	При запуске загружается схема с сервера или по умолчанию
🖱 Drag-and-drop	Поддержка перетаскивания .bpmn файлов
💾 Сохранение схемы	Кнопка Сохранить отправляет XML на сервер (POST /diagram)
🔁 Загрузка схемы с сервера	Кнопка Загрузить получает XML с сервера (GET /diagram)
⬇ Экспорт в .bpmn и .svg	Кнопки внизу для скачивания

🧩 Зависимости
Frontend:
bpmn-js

jQuery

Webpack 5

Backend:
Go (net/http)

🛠 Скрипты package.json
Скрипт	Назначение
npm run dev	Запуск dev-сервера с автообновлением
npm run build	Сборка в папку public/
npm start	То же, что npm run dev

📄 Лицензия

MIT License

Основано на [bpmn-js-examples](https://github.com/bpmn-io/bpmn-js-examples)  
Copyright (c) 2014-present bpmn.io (https://bpmn.io)  
Copyright (c) 2025 Александр Белов

Полный текст лицензии см. в файле [LICENSE](LICENSE).
