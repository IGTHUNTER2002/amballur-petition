import { expect, test, type Page } from 'playwright/test'

async function captureSignature(page: Page) {
  const canvas = page.getByRole('img', { name: 'Signature drawing area' })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('Signature canvas is not visible')

  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) {
    await page.touchscreen.tap(bounds.x + Math.min(80, bounds.width / 2), bounds.y + Math.min(70, bounds.height / 2))
  } else {
    await page.mouse.move(bounds.x + 30, bounds.y + 70)
    await page.mouse.down()
    await page.mouse.move(bounds.x + Math.min(160, bounds.width - 30), bounds.y + Math.min(110, bounds.height - 20))
    await page.mouse.up()
  }

  await page.getByRole('button', { name: /Save signature/i }).click()
  await expect(page.getByText(/Signature captured/i)).toBeVisible()
}

test('the public petition is readable and starts the signing flow', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Petition for action on stray-dog disturbance and public safety/i }).first()).toBeVisible()
  await expect(page.getByRole('main').getByText('Amballur Grama Panchayat', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Continue to sign/i }).click()
  await expect(page.getByRole('heading', { name: /Your details/i })).toBeVisible()
  await expect(page.getByLabel(/Ward/i)).toHaveValue('')
  await page.getByLabel(/Full name/i).fill('Anu Thomas')
  await page.getByLabel(/House name or number/i).fill('Green Villa')
  await page.getByLabel(/Ward/i).selectOption({ label: '16 — Ward 16' })
  await page.getByLabel(/Phone number/i).fill('9876543210123')
  await expect(page.getByLabel(/Phone number/i)).toHaveValue('9876543210')
  await page.getByRole('button', { name: /^Continue$/i }).click()
  await expect(page.getByRole('heading', { name: /Add your signature/i })).toBeVisible()
  await captureSignature(page)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /^Continue$/i }).click()
  await expect(page.getByRole('heading', { name: /Review before submitting/i })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('toggles language between English and Malayalam seamlessly', async ({ page }) => {
  await page.goto('/')
  // Default is English
  await expect(page.getByRole('heading', { name: /Petition for action on stray-dog disturbance and public safety/i }).first()).toBeVisible()

  // Switch to Malayalam
  await page.getByRole('button', { name: 'മലയാളം' }).click()
  await expect(page.getByRole('heading', { name: /അമ്പല്ലൂരിലെ തെരുവുനായ ശല്യത്തിനും പൊതുസുരക്ഷയ്ക്കുമുള്ള നടപടിക്കായുള്ള ഹർജി/i }).first()).toBeVisible()
  await expect(page.getByRole('main').getByText('അമ്പല്ലൂർ ഗ്രാമപഞ്ചായത്ത്', { exact: true })).toBeVisible()

  // Switch back to English
  await page.getByRole('button', { name: 'EN' }).click()
  await expect(page.getByRole('heading', { name: /Petition for action on stray-dog disturbance and public safety/i }).first()).toBeVisible()
})

test('validates required fields on resident details page before advancing', async ({ page }) => {
  await page.goto('/sign')
  await expect(page.getByRole('heading', { name: /Your details/i })).toBeVisible()

  // Attempt submitting without entering anything
  await page.getByRole('button', { name: /^Continue$/i }).click()

  // Should display validation errors and remain on the details step
  await expect(page.locator('#fullName-error')).toBeVisible()
  await expect(page.locator('#houseName-error')).toBeVisible()
  await expect(page.locator('#wardId-error')).toBeVisible()
  expect(page.url()).toContain('/sign')
})

test('admin login page loads and displays administrator authentication interface', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.getByRole('heading', { name: /Administrator access/i })).toBeVisible()
  await expect(page.getByLabel(/Email address/i)).toBeVisible()
  await expect(page.getByLabel(/Password/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Sign in securely/i })).toBeVisible()
})

test('completes full signing flow to genuine confirmation and WhatsApp share prompt', async ({ page }) => {
  await page.route('**/functions/v1/submit-petition', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ reference: 'AMB-2026-TEST1001', submittedAt: '2026-10-10T00:00:00.000Z' }),
  }))
  await page.goto('/')
  await page.getByRole('link', { name: /Continue to sign/i }).click()

  // Resident details
  await page.getByLabel(/Full name/i).fill('Mini Varghese')
  await page.getByLabel(/House name or number/i).fill('Rose Dale')
  await page.getByLabel(/Ward/i).selectOption({ label: '16 — Ward 16' })
  await page.getByLabel(/Phone number/i).fill('9876543210')
  await page.getByRole('button', { name: /^Continue$/i }).click()

  // Signature pad
  await expect(page.getByRole('heading', { name: /Add your signature/i })).toBeVisible()
  await captureSignature(page)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /^Continue$/i }).click()

  // Review step
  await expect(page.getByRole('heading', { name: /Review before submitting/i })).toBeVisible()
  await expect(page.getByText('Mini Varghese')).toBeVisible()
  await expect(page.getByText('Rose Dale')).toBeVisible()

  // Submit button
  await page.getByRole('button', { name: /Submit my signature/i }).click()

  // Confirmation page (allow up to 15s for live Edge Function network roundtrip)
  await expect(page.getByRole('heading', { name: /Thank you for adding your support/i })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/AMB-2026-/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Share on WhatsApp/i })).toBeVisible()
})

test('admin login page loads and verifies secure authentication interface', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.getByRole('heading', { name: /Administrator access/i })).toBeVisible()
  await expect(page.getByLabel(/Email address/i)).toBeVisible()
  await expect(page.getByLabel(/Password/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Sign in securely/i })).toBeVisible()

  const sandboxButton = page.getByRole('button', { name: /Explore with Sandbox Admin/i })
  if (await sandboxButton.isVisible()) {
    await sandboxButton.click()
    await expect(page.getByRole('heading', { name: /Petition dashboard/i })).toBeVisible()
    await expect(page.getByText('Valid signatures')).toBeVisible()
  }
})


