import { describe, expect, it } from 'vitest'
import { ApiError } from '#/lib/http'
import { createInMemoryAnnonceGateway } from './in-memory-annonce-gateway'
import type { DeposerAnnonceArgs } from './annonce-gateway'

const depot: DeposerAnnonceArgs = {
  titre: 'Vélo de course',
  description: 'Cadre carbone, très bon état.',
  prix: 45000,
  categorie: 'loisirs',
  ville: 'Lyon',
  codePostal: '69003',
  pseudo: 'cycliste69',
  email: 'cycliste@example.com',
  telephone: '',
  motDePasse: 'demo1234',
}

describe('in-memory annonce gateway, dépôt', () => {
  it('deposits an annonce with a mot de passe and never exposes it', async () => {
    const gateway = createInMemoryAnnonceGateway()

    const id = await gateway.deposerAnnonce(depot)

    const annonce = await gateway.consulterAnnonce(id)
    expect(annonce?.titre).toBe('Vélo de course')
    expect(JSON.stringify(annonce)).not.toContain('demo1234')
  })

  it('refuses a mot de passe that is missing or too short, naming the field', async () => {
    const gateway = createInMemoryAnnonceGateway()

    for (const motDePasse of ['', '1234567']) {
      const refus = await gateway
        .deposerAnnonce({ ...depot, motDePasse })
        .catch((error: unknown) => error)

      expect(refus).toBeInstanceOf(ApiError)
      expect((refus as ApiError).champ).toBe('motDePasse')
      expect((refus as ApiError).status).toBe(400)
    }
  })
})

describe('in-memory annonce gateway, suppression', () => {
  const supprimer = (
    gateway: ReturnType<typeof createInMemoryAnnonceGateway>,
    id: string,
    overrides: Partial<{ motDePasse: string; raison: string }> = {},
  ) =>
    gateway.supprimerAnnonce({
      id,
      motDePasse: 'demo1234',
      raison: 'autre',
      ...overrides,
    })

  it('withdraws an annonce with its mot de passe', async () => {
    const gateway = createInMemoryAnnonceGateway()
    const id = await gateway.deposerAnnonce(depot)

    await supprimer(gateway, id)

    expect(await gateway.consulterAnnonce(id)).toBeNull()
    expect((await gateway.rechercherAnnonces({})).total).toBe(0)
  })

  it('refuses a wrong mot de passe and keeps the annonce', async () => {
    const gateway = createInMemoryAnnonceGateway()
    const id = await gateway.deposerAnnonce(depot)

    const refus = await supprimer(gateway, id, { motDePasse: 'mauvais' }).catch(
      (error: unknown) => error,
    )

    expect((refus as ApiError).champ).toBe('motDePasse')
    expect(await gateway.consulterAnnonce(id)).not.toBeNull()
  })

  it('refuses an unknown raison, naming the field', async () => {
    const gateway = createInMemoryAnnonceGateway()
    const id = await gateway.deposerAnnonce(depot)

    const refus = await supprimer(gateway, id, { raison: '' }).catch(
      (error: unknown) => error,
    )

    expect((refus as ApiError).champ).toBe('raison')
  })

  it('answers 404 for an unknown or already withdrawn annonce', async () => {
    const gateway = createInMemoryAnnonceGateway()
    const id = await gateway.deposerAnnonce(depot)
    await supprimer(gateway, id)

    const refus = await supprimer(gateway, id).catch((error: unknown) => error)

    expect((refus as ApiError).status).toBe(404)
  })
})
