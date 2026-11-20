import { expect, test } from '@playwright/test'
import { ouvrir } from './support'

// Spark's tokens only exist in the built CSS, which jsdom never applies.

test('the pages use the Nunito Sans font of Spark', async ({ page }) => {
  await ouvrir(page, '/')

  const police = await page
    .locator('body')
    .evaluate((body) => getComputedStyle(body).fontFamily)
  expect(police).toMatch(/Nunito Sans/)
})

test('Spark sizes are not collapsed', async ({ page }) => {
  // Without the --spacing-factor theme variable, every Spark padding computes
  // to zero while colors still work.
  await ouvrir(page, '/')

  const bouton = page.getByRole('link', { name: 'Déposer une annonce' })
  const padding = await bouton.evaluate((el) =>
    parseFloat(getComputedStyle(el).paddingLeft),
  )
  expect(padding).toBeGreaterThan(0)
})

test('the theme toggle switches Spark to dark and back', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await ouvrir(page, '/')
  const html = page.locator('html')
  const toggle = page.getByRole('button', { name: /^Theme mode/ })
  const fond = () =>
    page.locator('body').evaluate((b) => getComputedStyle(b).backgroundColor)

  await expect(html).toHaveAttribute('data-theme', 'light')
  const fondClair = await fond()

  await toggle.click() // auto → light
  await toggle.click() // light → dark
  await expect(html).toHaveAttribute('data-theme', 'dark')
  expect(await fond()).not.toBe(fondClair)

  await ouvrir(page, '/')
  await expect(html).toHaveAttribute('data-theme', 'dark')
})
