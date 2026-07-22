import { expect, test, type Page } from '@playwright/test';

async function openApp(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const onboarding = page.getByRole('heading', {
    name: 'Настроим вашу дневную цель',
  });
  if ((await onboarding.count()) > 0) {
    await page.getByRole('button', { name: 'Сохранить и продолжить' }).click();
    await expect(page.getByRole('link', { name: 'Сегодня' })).toBeVisible();
    if (path !== '/') await page.goto(path);
  }
}

test('установленная PWA поддерживает горизонтальный режим', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chrome',
    'Проверка предназначена для мобильного проекта',
  );
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', {
      configurable: true,
      value: true,
    });
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await openApp(page, '/');

  const main = page.getByRole('main');
  await expect(main).toBeVisible();
  await expect(page.getByRole('link', { name: 'Сегодня' })).toBeVisible();
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    'width=device-width, initial-scale=1, viewport-fit=cover',
  );
  const mainBox = await main.boundingBox();
  expect((mainBox?.x ?? 0) + (mainBox?.width ?? 0)).toBeLessThanOrEqual(844);
});

test('первый запуск показывает пустой текущий день и встроенные напитки', async ({
  page,
}) => {
  await openApp(page, '/');

  await expect(page).toHaveTitle('Oasis');
  await expect(
    page.getByText('Oasis — Water Tracker', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Добр');
  await expect(page.getByText('Сегодня записей пока нет')).toBeVisible();
  await page.getByRole('link', { name: 'Напитки' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Вода', exact: true }),
  ).toBeVisible();
  await page.getByRole('searchbox', { name: 'Поиск' }).fill('МИНЕРАЛЬНАЯ');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Минеральная вода' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Вода', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Поиск' }).fill('нет такого');
  await expect(page.getByText('Напитки не найдены')).toBeVisible();
  await page.getByRole('button', { name: 'Очистить поиск' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Вода', exact: true }),
  ).toBeVisible();
});

test('пользователь создаёт напиток и добавляет его в сегодняшний день', async ({
  page,
}) => {
  await openApp(page, '/#/drinks');
  await page.getByRole('button', { name: 'Новый напиток' }).click();
  await page.getByRole('textbox', { name: 'Название' }).fill('Ройбуш');
  await page.getByRole('spinbutton', { name: 'Гидратация, %' }).fill('85');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(
    page.getByRole('heading', { level: 2, name: 'Ройбуш' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Сегодня' }).click();
  await page.getByRole('button', { name: 'Добавить запись' }).click();
  await page.getByRole('combobox', { name: 'Напиток', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Поиск напитка' }).fill('рой');
  await page.getByRole('option', { name: 'Ройбуш · 85%' }).click();
  await page.getByRole('combobox', { name: 'Напиток', exact: true }).click();
  const reopenedDrinkSearch = page.getByRole('searchbox', {
    name: 'Поиск напитка',
  });
  await reopenedDrinkSearch.pressSequentially('м');
  await expect(reopenedDrinkSearch).toBeFocused();
  await reopenedDrinkSearch.pressSequentially('о');
  await expect(reopenedDrinkSearch).toBeFocused();
  await reopenedDrinkSearch.fill('рой');
  await page.getByRole('option', { name: 'Ройбуш · 85%' }).click();
  await page.getByRole('button', { name: '330 мл' }).click();
  await expect(page.getByText('281 мл', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить запись' }).click();

  await expect(
    page.getByRole('heading', { level: 3, name: 'Ройбуш' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Выполнено 11% дневной цели' }),
  ).toBeVisible();
});

test('пользователь меняет дневную цель и тему', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium') {
    await page.setViewportSize({ width: 1280, height: 685 });
  }
  await openApp(page, '/#/settings');
  const profileDescription = page.getByText(
    'Обновите параметры и пересчитайте ориентировочную дневную цель',
  );
  const activityBox = await page
    .getByRole('combobox', { name: 'Активность' })
    .boundingBox();
  const themeOptions = await page
    .getByTestId('theme-picker')
    .locator('label > span')
    .all();
  const themeOptionBoxes = await Promise.all(
    themeOptions.map((option) => option.boundingBox()),
  );
  const themeOptionHeights = themeOptionBoxes.map((box) => box?.height ?? 0);
  const themeOptionWidths = themeOptionBoxes.map((box) => box?.width ?? 0);

  if (testInfo.project.name === 'chromium') {
    const profileDescriptionBox = await profileDescription.boundingBox();
    expect(profileDescriptionBox?.width).toBeGreaterThan(250);
  }
  expect(activityBox?.width).toBeGreaterThan(140);
  expect(themeOptions).toHaveLength(3);
  expect(new Set(themeOptionHeights).size).toBe(1);
  expect(
    Math.max(...themeOptionWidths) - Math.min(...themeOptionWidths),
  ).toBeLessThan(1);
  await expect(
    page.getByRole('link', {
      name: 'muchunzyan.github.io/water-tracker',
    }),
  ).toHaveAttribute('href', 'https://muchunzyan.github.io/water-tracker');
  await expect(themeOptions[0]).toHaveCSS(
    'font-size',
    testInfo.project.name === 'mobile-chrome' ? '16px' : '14px',
  );
  await page.getByRole('spinbutton', { name: 'Цель, мл' }).fill('2500');
  await page.getByRole('button', { name: 'Сохранить цель' }).click();
  await expect(page.getByRole('status')).toHaveText('Дневная цель сохранена');

  await page.getByRole('radio', { name: 'Тёмная' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Цель, мл' })).toHaveValue(
    '2500',
  );
  await expect(page.getByRole('radio', { name: 'Тёмная' })).toBeChecked();
});

test('история сохраняет выравнивание выбранного дня и итогов', async ({
  page,
}) => {
  await openApp(page, '/#/history');

  const selectedDay = page.locator('button[aria-pressed="true"]');
  await expect(selectedDay).toHaveCount(1);
  await expect(page.getByTestId('weekday-label')).toHaveText([
    'Пн',
    'Вт',
    'Ср',
    'Чт',
    'Пт',
    'Сб',
    'Вс',
  ]);
  const selectedDayBox = await selectedDay.boundingBox();
  const selectedTrackBox = await selectedDay
    .getByTestId('week-bar-track')
    .boundingBox();

  expect(selectedDayBox?.height).toBeGreaterThan(160);
  expect(
    (selectedTrackBox?.y ?? 0) - (selectedDayBox?.y ?? 0),
  ).toBeLessThanOrEqual(8);
  await expect(page.getByTestId('day-summary')).toHaveCSS(
    'flex-direction',
    'row',
  );
});
