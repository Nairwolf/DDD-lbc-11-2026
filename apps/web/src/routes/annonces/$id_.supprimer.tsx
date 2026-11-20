import { useState } from 'react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Button } from '@spark-ui/components/button'
import placeholder from '#/assets/annonce-placeholder.svg'
import { raisonsDeSuppression } from '#/features/annonce/raisons-suppression'
import { formatPrix } from '#/features/annonce/format'
import {
  annonceQueryOptions,
  supprimerAnnonceMutationOptions,
} from '#/features/annonce/queries'
import { supprimerAnnonceSchema } from '#/features/annonce/schemas'
import { useAppForm } from '#/hooks/form'
import { ApiError } from '#/lib/http'
import type { Annonce } from '#/features/annonce/annonce-gateway'
import type { SupprimerAnnonceValues } from '#/features/annonce/schemas'

export const Route = createFileRoute('/annonces/$id_/supprimer')({
  loader: async ({ context, params }) => {
    const annonce = await context.queryClient.ensureQueryData(
      annonceQueryOptions(context.gateways.annonce, params.id),
    )
    if (!annonce) {
      throw notFound()
    }
  },
  head: () => ({ meta: [{ title: 'Supprimer mon annonce' }] }),
  component: SupprimerAnnoncePage,
  notFoundComponent: AnnonceIntrouvable,
})

const valeursInitiales: SupprimerAnnonceValues = { raison: '', motDePasse: '' }

const champs = new Set<string>(Object.keys(valeursInitiales))

// An ApiError that names a field of the form is shown under that field;
// any other error is shown above the button.
const erreurDeChamp = (error: unknown) =>
  error instanceof ApiError && error.champ && champs.has(error.champ)
    ? {
        champ: error.champ as keyof SupprimerAnnonceValues,
        message: error.message,
      }
    : undefined

function SupprimerAnnoncePage() {
  const { gateways } = Route.useRouteContext()
  const { id } = Route.useParams()
  const { data: annonce } = useSuspenseQuery(
    annonceQueryOptions(gateways.annonce, id),
  )
  const [supprimee, setSupprimee] = useState(false)

  // Once withdrawn the annonce is gone for the query too: the confirmation
  // comes first.
  if (supprimee) {
    return <Confirmation />
  }
  if (!annonce) {
    return <AnnonceIntrouvable />
  }
  return (
    <FormulaireSuppression
      annonce={annonce}
      onSupprimee={() => setSupprimee(true)}
    />
  )
}

function FormulaireSuppression({
  annonce,
  onSupprimee,
}: {
  annonce: Annonce
  onSupprimee: () => void
}) {
  const { gateways, queryClient } = Route.useRouteContext()
  const suppression = useMutation(
    supprimerAnnonceMutationOptions(gateways.annonce, queryClient),
  )
  const image = annonce.images.at(0)

  const form = useAppForm({
    defaultValues: valeursInitiales,
    validators: { onChange: supprimerAnnonceSchema },
    listeners: {
      // An error of the API holds until the vendeur changes the field.
      onChange: ({ fieldApi }) => {
        if (fieldApi.state.meta.errorMap.onServer !== undefined) {
          fieldApi.setMeta((meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onServer: undefined },
          }))
        }
      },
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await suppression.mutateAsync({ id: annonce.id, ...value })
        onSupprimee()
      } catch (error) {
        const erreur = erreurDeChamp(error)
        if (erreur) {
          formApi.setFieldMeta(erreur.champ, (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onServer: erreur.message },
          }))
        }
      }
    },
  })

  const erreurGenerale =
    suppression.error && !erreurDeChamp(suppression.error)
      ? suppression.error.message
      : undefined

  return (
    <main className="page-wrap px-lg pt-2xl pb-2xl">
      <section className="mx-auto flex max-w-sz-640 flex-col gap-xl">
        <h1 className="text-display-2">Supprimer mon annonce</h1>
        <div className="flex items-center gap-lg rounded-xl border-sm border-outline p-md">
          <img
            src={image ?? placeholder}
            alt={image ? annonce.titre : 'Pas de photo'}
            className="size-sz-96 rounded-md object-cover"
          />
          <div className="flex flex-col gap-sm">
            <p className="text-headline-2">{annonce.titre}</p>
            <p className="text-body-1 text-main">{formatPrix(annonce.prix)}</p>
          </div>
        </div>
        <form
          noValidate
          className="flex flex-col gap-lg"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.AppField name="raison">
            {(field) => (
              <field.Select
                label="Raison de la suppression"
                placeholder="Choisissez une raison"
                values={raisonsDeSuppression.map(({ code, libelle }) => ({
                  value: code,
                  label: libelle,
                }))}
                isRequired
              />
            )}
          </form.AppField>
          <form.AppField name="motDePasse">
            {(field) => (
              <field.PasswordField
                label="Mot de passe de l'annonce"
                description="Celui que vous avez choisi en déposant l'annonce."
                autoComplete="current-password"
                isRequired
              />
            )}
          </form.AppField>

          {erreurGenerale && (
            <div
              role="alert"
              className="rounded-md bg-error-container p-md text-body-2 text-on-error-container"
            >
              {erreurGenerale}
            </div>
          )}

          <form.AppForm>
            <form.SubscribeButton label="Supprimer l'annonce" />
          </form.AppForm>
        </form>
      </section>
    </main>
  )
}

function Confirmation() {
  return (
    <main className="page-wrap px-lg pt-3xl pb-2xl">
      <section className="flex flex-col items-start gap-lg rounded-xl border-sm border-outline bg-surface px-xl py-3xl text-on-surface">
        <h1 className="text-display-2">Votre annonce a été supprimée</h1>
        <p className="text-body-1 text-on-surface/dim-1">
          Elle n'est plus en ligne.
        </p>
        <Button asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </section>
    </main>
  )
}

function AnnonceIntrouvable() {
  return (
    <main className="page-wrap px-lg pt-3xl pb-2xl">
      <section className="flex flex-col items-start gap-lg rounded-xl border-sm border-outline bg-surface px-xl py-3xl text-on-surface">
        <h1 className="text-display-2">Annonce introuvable</h1>
        <p className="text-body-1 text-on-surface/dim-1">
          Cette annonce n'existe pas ou n'est plus en ligne.
        </p>
        <Button asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </section>
    </main>
  )
}
