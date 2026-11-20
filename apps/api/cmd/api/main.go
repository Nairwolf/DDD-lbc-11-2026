package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"ddd-second-hand-marketplace/pkg/mailer"
)

func main() {
	handler, demoIDs, err := newServer(serverConfig{
		Mailer:      newMailer(),
		DemoData:    os.Getenv("DEMO_DATA") != "off",
		FrontendURL: envOr("FRONTEND_URL", "http://localhost:3000"),
	})
	if err != nil {
		log.Fatal(err)
	}
	if len(demoIDs) == 0 {
		fmt.Println("Demo data: DEMO_DATA=off, no annonce loaded")
	} else {
		fmt.Printf("Demo data: %d annonces loaded (set DEMO_DATA=off to skip), e.g. http://localhost:3000/annonces/%s\n", len(demoIDs), demoIDs[0])
	}

	addr := ":" + envOr("PORT", "8080")
	fmt.Printf("Server starting on http://localhost%s\n", addr)
	fmt.Printf("Health check available at http://localhost%s/health\n", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
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
