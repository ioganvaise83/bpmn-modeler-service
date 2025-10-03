package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5"
)

var dataDir = "./data"

// Database connection
var conn *pgx.Conn

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// Initialize database connection
	initDB()

	// Раздача статики из data директории
	fs := http.FileServer(http.Dir(dataDir))
	http.Handle("/", fs)

	// API эндпоинты для диаграмм
	http.HandleFunc("/diagram", handleDiagram)

	log.Printf("Сервер запущен на http://localhost:%s", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

func initDB() {
	var err error
	// Используем переменную окружения DATABASE_URL или значение по умолчанию
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://bpmn_user:bpmn_password@postgres:5432/bpmn_db?sslmode=disable"
	}

	conn, err = pgx.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	log.Println("Connected to database successfully")
}

func handleDiagram(w http.ResponseWriter, r *http.Request) {
	// Добавляем CORS заголовки для всех методов
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	// Обрабатываем preflight OPTIONS запрос
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case "GET":
		handleGetDiagram(w, r)
	case "POST":
		handlePostDiagram(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleGetDiagram(w http.ResponseWriter, r *http.Request) {
	// По умолчанию возвращаем diagram.bpmn
	filename := filepath.Join(dataDir, "diagram.bpmn")

	// Проверяем, существует ли файл
	if _, err := os.Stat(filename); os.IsNotExist(err) {
		// Если нет, пробуем найти любой .bpmn файл
		files, err := filepath.Glob(filepath.Join(dataDir, "*.bpmn"))
		if err != nil || len(files) == 0 {
			http.Error(w, "No diagram found", http.StatusNotFound)
			return
		}
		filename = files[0]
	}

	file, err := os.Open(filename)
	if err != nil {
		http.Error(w, "Error reading diagram", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	_, err = io.Copy(w, file)
	if err != nil {
		http.Error(w, "Error sending diagram", http.StatusInternalServerError)
		return
	}
}

func handlePostDiagram(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	// Сохраняем XML в базу данных
	xmlContent := string(body)
	_, err = conn.Exec(context.Background(), "INSERT INTO diagrams (diagram_xml, created_at) VALUES ($1, CURRENT_TIMESTAMP)", xmlContent)
	if err != nil {
		log.Printf("Error saving diagram to database: %v", err)
		http.Error(w, "Error saving diagram", http.StatusInternalServerError)
		return
	}

	// Также сохраняем в файл для обратной совместимости
	filename := filepath.Join(dataDir, "diagram.bpmn")
	err = os.WriteFile(filename, body, 0644)
	if err != nil {
		log.Printf("Warning: Could not save file to disk: %v", err)
		// Не возвращаем ошибку, так как данные уже сохранены в БД
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Diagram saved successfully")
}
