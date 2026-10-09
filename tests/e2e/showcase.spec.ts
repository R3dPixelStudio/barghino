import { test, expect } from '@playwright/test';

test('Persian and English landing content is server rendered without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const locale of ['fa', 'en']) {
    await page.goto(`http://127.0.0.1:3200/${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'fa' ? 'rtl' : 'ltr');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.main-navigation')).toBeVisible();
    expect(await page.locator('h1').innerText()).toContain(locale === 'fa' ? 'جریان' : 'Current.');
    expect(await page.locator('main > section').count()).toBe(3);
  }
  await context.close();
});

test('the switch energizes the shader and the carousel centers selected media', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/fa/');
  await expect(page.locator('.pulse-background')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.pulse-background')).toHaveAttribute('data-powered', 'true');
  await page.screenshot({ path: 'test-results/landing-desktop.png' });
  await page.getByRole('button', { name: 'کار بعدی', exact: true }).click();
  await expect(page.locator('.work-gallery')).toHaveAttribute('data-selected', '1');
  await expect(page.locator('.gallery-slide[data-active=true]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const other = page.locator('.gallery-slide').nth(2);
  await other.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.work-gallery')).toHaveAttribute('data-selected', '2');
  await page.locator('.gallery-slide[data-active=true]').click();
  await expect(page.locator('.gallery-lightbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.gallery-lightbox')).not.toBeVisible();
  await page.waitForTimeout(850);
  await page.screenshot({ path: 'test-results/gallery-desktop.png' });
  expect(errors).toEqual([]);
});

test('the GPU receives the power uniform and rendering stops on pause, offscreen and reduced motion', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const target = window as unknown as {
      drawCount: number;
      energyPower: number;
      side: number;
    };
    target.drawCount = 0;
    target.energyPower = 0;
    target.side = 0;
    const names = new WeakMap<WebGLUniformLocation, string>();
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const draw = proto.drawElements;
      proto.drawElements = function (...args) {
        target.drawCount++;
        return draw.apply(this, args);
      };
      const getLocation = proto.getUniformLocation;
      proto.getUniformLocation = function (program, name) {
        const location = getLocation.call(this, program, name);
        if (location) names.set(location, name);
        return location;
      };
      const setUniform = proto.uniform1f;
      proto.uniform1f = function (location, value) {
        if (location && names.get(location) === 'uPower') target.energyPower = value;
        if (location && names.get(location) === 'uSide') target.side = value;
        return setUniform.call(this, location, value);
      };
    }
  });
  await page.goto('/en/');
  await expect(page.locator('.pulse-background')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('switch').click();
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => (window as unknown as { energyPower: number }).energyPower),
  ).toBe(1);
  expect(await page.evaluate(() => (window as unknown as { side: number }).side)).toBe(1);
  const count = () => page.evaluate(() => (window as unknown as { drawCount: number }).drawCount);
  const start = await count();
  await page.waitForTimeout(200);
  expect(await count()).toBeGreaterThan(start);
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await page.waitForTimeout(200);
  const paused = await count();
  await page.waitForTimeout(300);
  expect(await count()).toBe(paused);
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await page.waitForTimeout(250);
  expect(await count()).toBeGreaterThan(paused);
  await page.locator('#project').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const offscreen = await count();
  await page.waitForTimeout(300);
  expect(await count()).toBe(offscreen);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#idea').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const reduced = await count();
  await page.waitForTimeout(300);
  expect(await count()).toBe(reduced);
});

test('mobile layouts fit both directions and support swipe selection', async ({ page }) => {
  for (const locale of ['fa', 'en']) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 960 });
      await page.goto(`/${locale}/`);
      await expect(page.locator('.pulse-background')).toHaveAttribute('data-ready', 'true');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      await expect(page.getByRole('switch')).toBeVisible();
      await expect(page.locator('.main-navigation')).toBeVisible();
      if (width === 390) {
        await page.screenshot({
          path: `test-results/${locale}-landing-mobile.png`,
          fullPage: true,
        });
        await page.locator('.gallery-viewport').scrollIntoViewIfNeeded();
        const box = await page.locator('.gallery-viewport').boundingBox();
        if (!box) throw new Error('Missing gallery');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width / 2 + (locale === 'fa' ? 100 : -100),
          box.y + box.height / 2,
          { steps: 8 },
        );
        await page.mouse.up();
        await expect(page.locator('.work-gallery')).toHaveAttribute('data-selected', '1');
      }
    }
  }
});

test('WebGL loss keeps the fallback, navigation and switch usable', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.pulse-background')).toHaveAttribute('data-ready', 'true');
  await page.locator('canvas').evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('link', { name: '02 Selected work' }).click();
  await expect(page).toHaveURL(/#work$/);
});

test('locale changes preserve power and mirror document direction', async ({ page }) => {
  await page.goto('/fa/');
  await page.getByRole('switch').click();
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
});

test('admin can upload media, save a draft, publish, edit, and unpublish an indexable article', async ({
  page,
  request,
}) => {
  const slug = `browser-check-${Date.now()}`;
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/admin/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByText('LOCAL MODE', { exact: false })).toBeVisible();
  await page.getByLabel('Article title', { exact: true }).fill('Electrical project planning');
  await page.getByLabel('Article language').selectOption('en');
  await page.getByLabel('Article URL', { exact: false }).fill(slug);
  await page
    .getByLabel('Summary and search description')
    .fill('A clear brief brings the whole installation together.');
  await page
    .getByLabel('Article content', { exact: false })
    .fill('## A coordinated installation\n\nConnect the building systems from the beginning.');
  await page.getByRole('button', { name: 'Save article' }).click();
  await expect(page.getByRole('status')).toContainText('Draft saved');
  expect((await request.get(`/en/journal/${slug}/`)).status()).toBe(404);
  await page.getByRole('button', { name: 'Media library', exact: false }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'test-cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKioAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByRole('status')).toContainText('Media uploaded');
  await page.getByRole('button', { name: 'Use as cover' }).first().click();
  await page.getByLabel('Cover image description').fill('A sample project image');
  await page.getByLabel('Publication status').selectOption('published');
  await page.getByRole('button', { name: 'Save article' }).click();
  await expect(page.getByRole('status')).toContainText('Published');
  const response = await request.get(`/en/journal/${slug}/`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<h2>A coordinated installation</h2>');
  expect(html).toContain('application/ld+json');
  expect(html).toContain('alt="A sample project image"');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(
    page.frameLocator('iframe').getByRole('heading', { name: 'A coordinated installation' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Article title', { exact: true }).fill('Updated electrical planning');
  await page.getByRole('button', { name: 'Save article' }).click();
  await expect(page.getByRole('status')).toContainText('Published');
  await page.reload();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: /Updated electrical planning/ }).click();
  await expect(page.getByLabel('Article title', { exact: true })).toHaveValue(
    'Updated electrical planning',
  );
  await page.getByLabel('Publication status').selectOption('draft');
  await page.getByRole('button', { name: 'Save article' }).click();
  await expect(page.getByRole('status')).toContainText('Draft saved');
  expect((await request.get(`/en/journal/${slug}/`)).status()).toBe(404);
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete article' }).click();
  await expect(page.getByRole('status')).toContainText('Article deleted');
  expect(errors).toEqual([]);
});

test('four professional selections and optional notes reach the admin inbox', async ({ page }) => {
  await page.goto('/en/#project');
  for (let index = 0; index < 4; index++) {
    await expect(page.locator('.guided-brief')).toHaveAttribute('data-step', String(index));
    await page.locator('.brief-choice').first().click();
    await page
      .getByRole('button', {
        name: index === 3 ? 'Make the connection' : 'Next question',
        exact: true,
      })
      .click();
  }
  await page.getByLabel('Your name').fill('Browser test developer');
  await page.getByLabel('Phone or email').fill('developer@example.test');
  await page.getByRole('button', { name: 'Start the project conversation' }).click();
  await expect(page.locator('.brief-success')).toContainText('received');
  await page.goto('/admin/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Project enquiries', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Browser test developer' }).first()).toBeVisible();
  await expect(
    page.locator('.inquiry').filter({ hasText: 'Browser test developer' }).first(),
  ).toContainText('planning / installation / soon');
});

test('the assistant handles unavailable configuration and preserves input after failure', async ({
  page,
}) => {
  await page.goto('/en/');
  await page.locator('.assistant-launcher').click();
  await expect(page.locator('.assistant-offline')).toContainText('not connected yet');
  await page.keyboard.press('Escape');
  await page.route('**/api/assistant/config', (route) =>
    route.fulfill({ json: { available: true } }),
  );
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 503, json: { error: 'Unavailable' } }),
  );
  await page.reload();
  await page.locator('.assistant-launcher').click();
  await page.getByLabel('Your message', { exact: true }).fill('How do we begin?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.assistant-dialog').getByRole('alert')).toContainText('preserved');
  await expect(page.getByLabel('Your message', { exact: true })).toHaveValue('How do we begin?');
  await page.route('**/api/chat', (route) =>
    route.fulfill({ json: { reply: 'Please share your project brief.' } }),
  );
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('log')).toContainText('Please share your project brief.');
});

test('admin publishes gallery media and edits the assistant persona', async ({ page, request }) => {
  await page.goto('/admin/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Media library', exact: false }).click();
  await page.locator('input[type=file]').setInputFiles('public/previews/lighting.webp');
  await expect(page.getByRole('status')).toContainText('Media uploaded');
  await page.getByRole('button', { name: 'Portfolio gallery', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Image or video', exact: true })
    .selectOption({ label: 'lighting.webp' });
  await page.getByLabel('Persian title', { exact: true }).fill('پروژه آزمایشی');
  await page.getByLabel('English title', { exact: true }).fill('Gallery browser verification');
  await page.getByLabel('Persian image description', { exact: true }).fill('روشنایی');
  await page.getByLabel('English image description', { exact: true }).fill('Lighting');
  await page.getByLabel('Gallery visibility').selectOption('published');
  await page.getByRole('button', { name: 'Save gallery item' }).click();
  await expect(page.getByText('Gallery item saved.', { exact: true })).toBeVisible();
  const published = await (await request.get('/api/portfolio')).json();
  expect(published[0].titleEn).toBe('Gallery browser verification');
  await page.getByRole('button', { name: 'Assistant settings', exact: true }).click();
  await page
    .getByLabel('Assistant persona and tone')
    .fill('You are our precise professional electrical contracting assistant.');
  await page.getByRole('button', { name: 'Save assistant settings' }).click();
  await expect(page.getByText('Assistant settings saved.', { exact: true })).toBeVisible();
  await page.goto('/en/#work');
  await expect(page.locator('.gallery-caption')).toContainText('Gallery browser verification');
  await expect(page.locator('.concept-chip')).toHaveCount(0);
});
