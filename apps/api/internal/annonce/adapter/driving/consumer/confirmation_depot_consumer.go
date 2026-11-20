// Package consumer holds the driving adapters that react to domain events.
package consumer

import (
	"log"

	"ddd-second-hand-marketplace/internal/annonce/application/command"
	"ddd-second-hand-marketplace/internal/annonce/domain"
	"ddd-second-hand-marketplace/pkg/eventbus"
)

// SubscribeConfirmationDepot sends the confirmation de dépôt on each
// AnnonceDeposee. A send failure is logged, never retried, and never fails the
// deposit.
func SubscribeConfirmationDepot(bus eventbus.Bus, envoyer command.EnvoyerConfirmationDepotCommand) error {
	return bus.Subscribe(domain.AnnonceDeposeeEventType, func(event eventbus.DomainEvent) error {
		e, ok := event.(*domain.AnnonceDeposeeEvent)
		if !ok {
			return nil
		}
		if err := envoyer(e.Annonce); err != nil {
			log.Printf("confirmation de depot: annonce %s: %v", e.Annonce.ID(), err)
		}
		return nil
	})
}
