package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	annonceinmemory "ddd-second-hand-marketplace/internal/annonce/adapter/driven/inmemory"
	annonceconsumer "ddd-second-hand-marketplace/internal/annonce/adapter/driving/consumer"
	annoncehttp "ddd-second-hand-marketplace/internal/annonce/adapter/driving/http"
	annoncecommand "ddd-second-hand-marketplace/internal/annonce/application/command"
	annoncequery "ddd-second-hand-marketplace/internal/annonce/application/query"
	"ddd-second-hand-marketplace/pkg/eventbus"
	"ddd-second-hand-marketplace/pkg/mailer"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Shared infrastructure.
	eventBus := eventbus.NewAsyncInMemoryEventBus()
	mail := newMailer()

	// Bounded context: annonce.
	annonceRepository := annonceinmemory.NewInMemoryAnnonceRepository()
	if os.Getenv("DEMO_DATA") == "off" {
		fmt.Println("Demo data: DEMO_DATA=off, no annonce loaded")
	} else {
		ids, err := loadDemoAnnonces(annonceRepository)
		if err != nil {
			log.Fatalf("Demo data: %v", err)
		}
		fmt.Printf("Demo data: %d annonces loaded (set DEMO_DATA=off to skip), e.g. http://localhost:3000/annonces/%s\n", len(ids), ids[0])
	}
	if err := annonceconsumer.SubscribeConfirmationDepot(eventBus, annoncecommand.BuildEnvoyerConfirmationDepotCommand(
		mail, "noreply@seconde-main.local", envOr("FRONTEND_URL", "http://localhost:3000"),
	)); err != nil {
		log.Fatalf("Consumer: %v", err)
	}
	annoncehttp.NewHandler(
		annoncequery.BuildConsulterAnnonceQuery(annonceRepository),
		annoncequery.BuildRechercherAnnoncesQuery(annonceRepository),
		annoncequery.BuildListerRegionsQuery(),
		annoncecommand.BuildDeposerAnnonceCommand(annonceRepository, eventBus, time.Now),
		annoncecommand.BuildSupprimerAnnonceCommand(annonceRepository, eventBus, time.Now),
	).RegisterRoutes(mux)

	fmt.Println("Server starting on http://localhost:8080")
	fmt.Println("Health check available at http://localhost:8080/health")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// newMailer sends through the SMTP server at SMTP_ADDR (Mailcatcher in
// development), or falls back to the fake mailer that only logs.
func newMailer() mailer.Mailer {
	addr := os.Getenv("SMTP_ADDR")
	if addr == "" {
		fmt.Println("Mailer: SMTP_ADDR is not set, emails are logged only")
		return mailer.NewFakeMailer()
	}
	fmt.Printf("Mailer: sending emails through SMTP at %s\n", addr)
	return mailer.NewSMTPMailer(addr)
}
