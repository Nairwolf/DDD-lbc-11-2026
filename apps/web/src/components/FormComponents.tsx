import { Button } from '@spark-ui/components/button'
import { FormField } from '@spark-ui/components/form-field'
import { Input, InputGroup } from '@spark-ui/components/input'
import { Select as SparkSelect } from '@spark-ui/components/select'
import { Textarea } from '@spark-ui/components/textarea'
import { useStore } from '@tanstack/react-form'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { useFieldContext, useFormContext } from '#/hooks/form-context'

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}

type FieldError = string | { message: string } | undefined

// The messages of a field, once the vendeur has touched it (submitting
// touches every field). Errors come from the schema or from the API.
function useVisibleErrors(): Array<string> {
  const field = useFieldContext<string>()
  const errors = useStore(
    field.store,
    (state) => state.meta.errors as Array<FieldError>,
  )
  const isTouched = useStore(field.store, (state) => state.meta.isTouched)
  if (!isTouched) {
    return []
  }
  const messages = errors.flatMap((error) =>
    error === undefined
      ? []
      : [typeof error === 'string' ? error : error.message],
  )
  return [...new Set(messages)]
}

// Wraps a control in a Spark FormField: label, error state and messages.
function Field({
  label,
  description,
  isRequired,
  children,
}: {
  label: string
  description?: string
  isRequired?: boolean
  children: ReactNode
}) {
  const field = useFieldContext<string>()
  const messages = useVisibleErrors()

  return (
    <FormField
      name={field.name}
      state={messages.length > 0 ? 'error' : undefined}
      isRequired={isRequired}
      className="flex flex-col gap-sm"
    >
      <FormField.Label>{label}</FormField.Label>
      {children}
      {description && (
        <FormField.HelperMessage>{description}</FormField.HelperMessage>
      )}
      {messages.map((message) => (
        <FormField.ErrorMessage key={message}>{message}</FormField.ErrorMessage>
      ))}
    </FormField>
  )
}

export function TextField({
  label,
  description,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  isRequired,
}: {
  label: string
  description?: string
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'decimal' | 'numeric' | 'email' | 'tel'
  autoComplete?: string
  isRequired?: boolean
}) {
  const field = useFieldContext<string>()

  return (
    <Field label={label} description={description} isRequired={isRequired}>
      <Input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onValueChange={field.handleChange}
      />
    </Field>
  )
}

// A text field for a secret, with a button that shows or hides what is typed.
export function PasswordField({
  label,
  description,
  autoComplete,
  isRequired,
}: {
  label: string
  description?: string
  autoComplete?: string
  isRequired?: boolean
}) {
  const field = useFieldContext<string>()
  const [visible, setVisible] = useState(false)
  const messages = useVisibleErrors()

  return (
    <Field label={label} description={description} isRequired={isRequired}>
      <InputGroup state={messages.length > 0 ? 'error' : undefined}>
        <Input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={field.state.value}
          onBlur={field.handleBlur}
          onValueChange={field.handleChange}
        />
        <InputGroup.TrailingAddon>
          <Button
            type="button"
            design="ghost"
            intent="neutral"
            size="sm"
            aria-pressed={visible}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? 'Masquer' : 'Afficher'}
          </Button>
        </InputGroup.TrailingAddon>
      </InputGroup>
    </Field>
  )
}

export function TextArea({
  label,
  description,
  rows = 3,
  isRequired,
}: {
  label: string
  description?: string
  rows?: number
  isRequired?: boolean
}) {
  const field = useFieldContext<string>()

  return (
    <Field label={label} description={description} isRequired={isRequired}>
      <Textarea
        value={field.state.value}
        rows={rows}
        onBlur={field.handleBlur}
        onValueChange={field.handleChange}
      />
    </Field>
  )
}

export function Select({
  label,
  values,
  placeholder,
  isRequired,
}: {
  label: string
  values: Array<{ label: string; value: string }>
  placeholder?: string
  isRequired?: boolean
}) {
  const field = useFieldContext<string>()

  return (
    <Field label={label} isRequired={isRequired}>
      <SparkSelect value={field.state.value} onValueChange={field.handleChange}>
        <SparkSelect.Trigger>
          <SparkSelect.Value />
        </SparkSelect.Trigger>
        <SparkSelect.Items onBlur={field.handleBlur}>
          {placeholder !== undefined && (
            <SparkSelect.Placeholder>{placeholder}</SparkSelect.Placeholder>
          )}
          {values.map((value) => (
            <SparkSelect.Item key={value.value} value={value.value}>
              {value.label}
            </SparkSelect.Item>
          ))}
        </SparkSelect.Items>
      </SparkSelect>
    </Field>
  )
}
