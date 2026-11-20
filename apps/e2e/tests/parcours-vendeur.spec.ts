import { expect, test } from '@playwright/test'
import { emailPour, ouvrir, remplirLeDepot, unDepot, unJeton } from './support'

// The whole journey of a vendeur on the real stack: the form, the API, the
// async email through SMTP, the link of the email, the suppression. Each page
// is unit-tested on in-memory gateways; this checks they hold together.
test('a vendeur deposits an annonce, gets the email and withdraws it', async ({
  page,
  request,
}) => {
  const jeton = unJeton()
  const depot = unDepot(jeton, {
    titre: `Vélo électrique ${jeton}`,
    prix: 89050,
    categorie: 'loisirs',
    ville: 'Ajaccio',
    codePostal: '20090',
  })

  // Dépôt, from the header button.
  await ouvrir(page, '/')
  await page.getByRole('link', { name: 'Déposer une annonce' }).click()
  await remplirLeDepot(page, depot)
  await page.getByRole('button', { name: "Publier l'annonce" }).click()

  await expect(page.getByText('Annonce déposée')).toBeVisible()
  await expect(page.getByRole('heading', { name: depot.titre })).toBeVisible()
  await expect(page).toHaveURL(/\/annonces\/[0-9a-f-]{36}$/)
  const urlAnnonce = page.url()
  // The prix went in centimes and the API derived the lieu from the code postal.
  await expect(page.getByText(/890,50/)).toBeVisible()
  await expect(page.getByText('Corse-du-Sud (2A), Corse')).toBeVisible()

  // The new annonce is online: first on the home page, found by mot-clé
  // without its accents.
  await ouvrir(page, '/')
  await expect(page.getByText(depot.titre).first()).toBeVisible()
  await page.getByLabel('Mot-clé').fill(`velo ELECTRIQUE ${jeton}`)
  await page.getByRole('button', { name: 'Rechercher' }).click()
  await expect(page.getByRole('heading', { name: '1 annonce' })).toBeVisible()
  await page.getByText(depot.titre).click()
  await expect(page).toHaveURL(urlAnnonce)

  // The confirmation email, through Mailcatcher.
  const email = await emailPour(request, depot.email)
  expect(email.subject).toContain(depot.titre)
  expect(email.body).toContain(urlAnnonce)
  expect(email.body).not.toContain(depot.motDePasse)
  const lienSuppression = email.body.match(/http\S+\/supprimer/)?.[0]
  expect(lienSuppression).toBe(`${urlAnnonce}/supprimer`)

  // Suppression from the link of the email: a wrong mot de passe first, which
  // only the API can refuse.
  await ouvrir(page, lienSuppression!)
  await expect(page.getByText(depot.titre)).toBeVisible()
  await page
    .getByLabel(/^Raison de la suppression/)
    .selectOption('vendue-ailleurs')
  await page.getByLabel(/^Mot de passe/).fill('mauvais-mot')
  await page.getByRole('button', { name: "Supprimer l'annonce" }).click()
  await expect(
    page.getByText("Le mot de passe de l'annonce est incorrect"),
  ).toBeVisible()

  await page.getByLabel(/^Mot de passe/).fill(depot.motDePasse)
  await page.getByRole('button', { name: "Supprimer l'annonce" }).click()
  await expect(
    page.getByRole('heading', { name: 'Votre annonce a été supprimée' }),
  ).toBeVisible()

  // Gone everywhere.
  await ouvrir(page, urlAnnonce)
  await expect(
    page.getByRole('heading', { name: 'Annonce introuvable' }),
  ).toBeVisible()
  await ouvrir(page, `/recherche?motCle=${jeton}`)
  await expect(page.getByRole('heading', { name: '0 annonce' })).toBeVisible()
  await ouvrir(page, lienSuppression!)
  await expect(
    page.getByRole('heading', { name: 'Annonce introuvable' }),
  ).toBeVisible()
})
