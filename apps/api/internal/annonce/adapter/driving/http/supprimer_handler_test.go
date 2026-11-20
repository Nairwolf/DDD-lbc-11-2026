package http

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func deposerUneAnnonce(t *testing.T, mux *http.ServeMux) string {
	t.Helper()
	var body DeposerAnnonceResponse
	require.NoError(t, json.NewDecoder(post(mux, "/annonces", depotValide).Body).Decode(&body))
	return body.ID
}

func TestSupprimerAnnonce_AnswersNoContentAndTakesTheAnnonceOffline(t *testing.T) {
	_, mux := setupHandler(t)
	id := deposerUneAnnonce(t, mux)

	rec := post(mux, "/annonces/"+id+"/suppression", `{"motDePasse": "demo1234", "raison": "vendue-sur-le-site"}`)

	assert.Equal(t, http.StatusNoContent, rec.Code)
	assert.Equal(t, http.StatusNotFound, get(mux, "/annonces/"+id).Code)
	var recherche RechercherAnnoncesResponse
	require.NoError(t, json.NewDecoder(get(mux, "/annonces").Body).Decode(&recherche))
	assert.Zero(t, recherche.Total)
}

func TestSupprimerAnnonce_AnswersBadRequestNamingTheField(t *testing.T) {
	tests := []struct {
		name, body, champ string
	}{
		{"wrong mot de passe", `{"motDePasse": "mauvais-mot", "raison": "autre"}`, "motDePasse"},
		{"missing raison", `{"motDePasse": "demo1234"}`, "raison"},
		{"unknown raison", `{"motDePasse": "demo1234", "raison": "inconnue"}`, "raison"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, mux := setupHandler(t)
			id := deposerUneAnnonce(t, mux)

			rec := post(mux, "/annonces/"+id+"/suppression", tt.body)

			assert.Equal(t, http.StatusBadRequest, rec.Code)
			assert.Contains(t, rec.Body.String(), `"champ":"`+tt.champ+`"`)
			assert.Equal(t, http.StatusOK, get(mux, "/annonces/"+id).Code)
		})
	}
}

func TestSupprimerAnnonce_AnswersNotFoundForAnUnknownOrAlreadySupprimeeAnnonce(t *testing.T) {
	_, mux := setupHandler(t)
	id := deposerUneAnnonce(t, mux)
	body := `{"motDePasse": "demo1234", "raison": "autre"}`
	require.Equal(t, http.StatusNoContent, post(mux, "/annonces/"+id+"/suppression", body).Code)

	assert.Equal(t, http.StatusNotFound, post(mux, "/annonces/"+id+"/suppression", body).Code)
	assert.Equal(t, http.StatusNotFound, post(mux, "/annonces/6f1c1c2e-8a43-4b7e-9d52-0a1b2c3d4e5f/suppression", body).Code)
}

func TestSupprimerAnnonce_AnswersBadRequestForAMalformedID(t *testing.T) {
	_, mux := setupHandler(t)

	rec := post(mux, "/annonces/nope/suppression", `{"motDePasse": "demo1234", "raison": "autre"}`)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.False(t, strings.Contains(rec.Body.String(), "champ"))
}
