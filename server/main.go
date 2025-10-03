package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

var dataDir = "./data"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

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

func handleDiagram(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		log.Printf("Вызван метод:%s", r.Method)
		handleGetDiagram(w, r)
	case "POST":
		log.Printf("Вызван метод:%s", r.Method)
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

	// Сохраняем в diagram.bpmn
	filename := filepath.Join(dataDir, "diagram.bpmn")
	err = os.WriteFile(filename, body, 0644)
	if err != nil {
		http.Error(w, "Error saving diagram", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Diagram saved successfully")
}
