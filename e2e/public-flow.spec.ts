import { expect, test } from 'playwright/test'

test('the public petition is readable and starts the signing flow', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Petition for humane stray dog public-safety action/i }).first()).toBeVisible()
  await expect(page.getByRole('main').getByText('Amballur Grama Panchayat', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Continue to sign/i }).click()
  await expect(page.getByRole('heading', { name: /Your details/i })).toBeVisible()
  await expect(page.getByLabel(/Ward/i)).toHaveValue('')
  await page.getByLabel(/Full name/i).fill('Anu Thomas')
  await page.getByLabel(/House name or number/i).fill('Green Villa')
  await page.getByLabel(/Ward/i).selectOption({ label: '16 — Ward 16' })
  await page.getByRole('button', { name: /^Continue$/i }).click()
  await expect(page.getByRole('heading', { name: /Add your signature/i })).toBeVisible()
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Signature canvas is not visible')
  await page.mouse.move(box.x + 30, box.y + 95)
  await page.mouse.down()
  await page.mouse.move(box.x + 90, box.y + 55)
  await page.mouse.move(box.x + 150, box.y + 110)
  await page.mouse.up()
  await page.getByRole('button', { name: /Save signature/i }).click()
  await expect(page.getByText(/Signature captured/i)).toBeVisible()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /^Continue$/i }).click()
  await expect(page.getByRole('heading', { name: /Review before submitting/i })).toBeVisible()
})

test('toggles language between English and Malayalam seamlessly', async ({ page }) => {
  await page.goto('/')
  // Default is English
  await expect(page.getByRole('heading', { name: /Petition for humane stray dog public-safety action/i }).first()).toBeVisible()

  // Switch to Malayalam
  await page.getByRole('button', { name: 'മലയാളം' }).click()
  await expect(page.getByRole('heading', { name: /മാനുഷികമായ തെരുവ് നായ പൊതുസുരക്ഷാ നടപടിക്കായുള്ള ഹർജി/i }).first()).toBeVisible()
  await expect(page.getByRole('main').getByText('അമ്പല്ലൂർ ഗ്രാമപഞ്ചായത്ത്', { exact: true })).toBeVisible()

  // Switch back to English
  await page.getByRole('button', { name: 'EN' }).click()
  await expect(page.getByRole('heading', { name: /Petition for humane stray dog public-safety action/i }).first()).toBeVisible()
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

