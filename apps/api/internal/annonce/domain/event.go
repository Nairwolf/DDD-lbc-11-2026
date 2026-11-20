package domain

import (
	"time"

	"github.com/google/uuid"
)

// AnnonceDeposeeEvent is emitted once a new annonce has been deposited and
// persisted. Moderation will subscribe to it.
type AnnonceDeposeeEvent struct {
	id         string
	occurredAt time.Time
	Annonce    *Annonce
}

const AnnonceDeposeeEventType = "AnnonceDeposee"

func NewAnnonceDeposeeEvent(occurredAt time.Time, annonce *Annonce) *AnnonceDeposeeEvent {
	return &AnnonceDeposeeEvent{id: uuid.NewString(), occurredAt: occurredAt, Annonce: annonce}
}

// EventType implements eventbus.DomainEvent.
func (e *AnnonceDeposeeEvent) EventType() string { return AnnonceDeposeeEventType }
func (e *AnnonceDeposeeEvent) ID() string        { return e.id }
func (e *AnnonceDeposeeEvent) OccurredAt() time.Time {
	return e.occurredAt
}

// AnnonceSupprimeeEvent is emitted once a vendeur has withdrawn his annonce
// and the change is persisted. It carries the raison: the annonce does not.
type AnnonceSupprimeeEvent struct {
	id          string
	occurredAt  time.Time
	AnnonceID   string
	Raison      RaisonSuppression
	SupprimeeLe time.Time
}

const AnnonceSupprimeeEventType = "AnnonceSupprimee"

func NewAnnonceSupprimeeEvent(occurredAt time.Time, annonceID string, raison RaisonSuppression) *AnnonceSupprimeeEvent {
	return &AnnonceSupprimeeEvent{id: uuid.NewString(), occurredAt: occurredAt, AnnonceID: annonceID, Raison: raison, SupprimeeLe: occurredAt}
}

// EventType implements eventbus.DomainEvent.
func (e *AnnonceSupprimeeEvent) EventType() string { return AnnonceSupprimeeEventType }
func (e *AnnonceSupprimeeEvent) ID() string        { return e.id }
func (e *AnnonceSupprimeeEvent) OccurredAt() time.Time {
	return e.occurredAt
}
