import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createInMemoryAnnonceGateway } from '#/features/annonce/in-memory-annonce-gateway'
import { renderRoute } from '#/test/renderRoute'
import { uneAnnonce } from '#/test/annonces'

const annonce = uneAnnonce({ titre: 'Vélo électrique de ville', prix: 89000 })

const renderSuppression = (id = annonce.id) =>
  renderRoute(`/annonces/${id}/supprimer`, {
    gateways: {
      annonce: createInMemoryAnnonceGateway({ annonces: [annonce] }),
    },
  })

async function remplir(
  user: ReturnType<typeof userEvent.setup>,
  motDePasse: string,
  raison = 'vendue-ailleurs',
) {
  await user.selectOptions(screen.getByLabelText(/^Raison/), raison)
  await user.type(screen.getByLabelText(/^Mot de passe/), motDePasse)
}

const supprimer = () =>
  screen.getByRole('button', { name: "Supprimer l'annonce" })

describe('Supprimer une annonce page', () => {
  it('recaps the annonce before asking for the mot de passe', async () => {
    await renderSuppression()

    expect(
      await screen.findByText('Vélo électrique de ville'),
    ).toBeInTheDocument()
    expect(screen.getByText(/890/)).toBeInTheDocument()
    expect(screen.getByAltText('Pas de photo')).toBeInTheDocument()
  })

  it('withdraws the annonce and confirms it', async () => {
    const user = userEvent.setup()
    await renderSuppression()
    await screen.findByText('Vélo électrique de ville')

    await remplir(user, 'demo1234')
    await user.click(supprimer())

    expect(
      await screen.findByText('Votre annonce a été supprimée'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: "Supprimer l'annonce" }),
    ).toBeNull()
  })

  it('shows a wrong mot de passe under its field and lets the vendeur retry', async () => {
    const user = userEvent.setup()
    await renderSuppression()
    await screen.findByText('Vélo électrique de ville')

    await remplir(user, 'mauvais-mot')
    await user.click(supprimer())

    expect(
      await screen.findByText("Le mot de passe de l'annonce est incorrect"),
    ).toBeInTheDocument()
    expect(screen.queryByText('Votre annonce a été supprimée')).toBeNull()

    await user.clear(screen.getByLabelText(/^Mot de passe/))
    await user.type(screen.getByLabelText(/^Mot de passe/), 'demo1234')
    await user.click(supprimer())

    expect(
      await screen.findByText('Votre annonce a été supprimée'),
    ).toBeInTheDocument()
  })

  it('asks for a raison and a mot de passe', async () => {
    const user = userEvent.setup()
    await renderSuppression()
    await screen.findByText('Vélo électrique de ville')

    await user.click(supprimer())

    expect(await screen.findAllByText('Choisissez une raison')).toHaveLength(3) // placeholder, option, error
    expect(
      screen.getByText("Saisissez le mot de passe de l'annonce"),
    ).toBeInTheDocument()
  })

  it('says the annonce is introuvable instead of the form', async () => {
    await renderSuppression(crypto.randomUUID())

    expect(
      await screen.findByRole('heading', { name: 'Annonce introuvable' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: "Supprimer l'annonce" }),
    ).toBeNull()
  })
})
