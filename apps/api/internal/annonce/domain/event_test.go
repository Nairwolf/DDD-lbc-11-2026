package domain

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewAnnonceDeposeeEvent_CarriesTheAnnonce(t *testing.T) {
	annonce, err := NewAnnonce(validArgs())
	require.NoError(t, err)
	occurredAt := time.Date(2026, 11, 2, 10, 0, 1, 0, time.UTC)

	event := NewAnnonceDeposeeEvent(occurredAt, annonce)

	assert.Equal(t, "AnnonceDeposee", event.EventType())
	assert.NotEmpty(t, event.ID())
	assert.Equal(t, occurredAt, event.OccurredAt())
	assert.Same(t, annonce, event.Annonce)
}

func TestNewAnnonceSupprimeeEvent_CarriesIDRaisonAndDate(t *testing.T) {
	raison, err := NewRaisonSuppression("vendue-ailleurs")
	require.NoError(t, err)
	occurredAt := time.Date(2026, 11, 3, 10, 0, 0, 0, time.UTC)

	event := NewAnnonceSupprimeeEvent(occurredAt, "abc", raison)

	assert.Equal(t, "AnnonceSupprimee", event.EventType())
	assert.NotEmpty(t, event.ID())
	assert.Equal(t, "abc", event.AnnonceID)
	assert.Equal(t, raison, event.Raison)
	assert.Equal(t, occurredAt, event.SupprimeeLe)
	assert.Equal(t, occurredAt, event.OccurredAt())
}
