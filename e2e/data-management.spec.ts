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

test('пользователь редактирует и удаляет запись текущего дня', async ({
  page,
}) => {
  await openApp(page, '/');
  await page.getByRole('button', { name: 'Добавить запись' }).click();
  await page.getByRole('button', { name: '250 мл' }).click();
  await page.getByRole('button', { name: 'Сохранить запись' }).click();

  await expect(
    page.getByRole('heading', { level: 3, name: 'Вода' }),
  ).toBeVisible();
  const todayEntryCard = page
    .getByRole('heading', { level: 3, name: 'Вода' })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await expect(todayEntryCard.locator('.lucide-droplet')).toBeVisible();
  const editButton = todayEntryCard.getByRole('button', { name: 'Изменить' });
  const sharedEditButtonClass = await editButton.getAttribute('class');
  const sharedEditButtonHeight = (await editButton.boundingBox())?.height;
  expect(sharedEditButtonHeight).toBe(48);
  await editButton.click();
  await page.getByRole('spinbutton', { name: 'Выпито, мл' }).fill('500');
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();

  await expect(
    page.getByRole('img', { name: 'Выполнено 19% дневной цели' }),
  ).toBeVisible();
  await expect(page.getByText('500 мл', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'История' }).click();
  const historyEntryCard = page
    .getByRole('heading', { level: 3, name: 'Вода' })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await expect(historyEntryCard.locator('.lucide-droplet')).toBeVisible();
  const historyEditButton = historyEntryCard.getByRole('button', {
    name: 'Изменить',
  });
  await expect(historyEditButton).toBeVisible();
  expect(await historyEditButton.getAttribute('class')).toBe(
    sharedEditButtonClass,
  );
  expect((await historyEditButton.boundingBox())?.height).toBe(
    sharedEditButtonHeight,
  );

  await page.getByRole('link', { name: 'Напитки' }).click();
  const catalogCard = page
    .getByRole('heading', { level: 2, name: 'Вода', exact: true })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  const catalogEditButton = catalogCard.getByRole('button', {
    name: 'Изменить',
  });
  expect(await catalogEditButton.getAttribute('class')).toBe(
    sharedEditButtonClass,
  );
  expect((await catalogEditButton.boundingBox())?.height).toBe(
    sharedEditButtonHeight,
  );

  await page.getByRole('link', { name: 'Сегодня' }).click();
  const returnedTodayCard = page
    .getByRole('heading', { level: 3, name: 'Вода' })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await expect(returnedTodayCard).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await returnedTodayCard.getByRole('button', { name: 'Удалить' }).click();
  await expect(page.getByText('Сегодня записей пока нет')).toBeVisible();
});

test('пользователь редактирует и удаляет собственный напиток', async ({
  page,
}) => {
  await openApp(page, '/#/drinks');
  await page.getByRole('button', { name: 'Новый напиток' }).click();
  await page.getByRole('textbox', { name: 'Название' }).fill('Тархун');
  await page.getByRole('button', { name: 'Создать' }).click();

  const card = page
    .getByRole('heading', { level: 2, name: 'Тархун' })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await card.getByRole('button', { name: 'Изменить' }).click();
  await page.getByRole('textbox', { name: 'Название' }).fill('Домашний компот');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Домашний компот' }),
  ).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  const updatedCard = page
    .getByRole('heading', { level: 2, name: 'Домашний компот' })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await updatedCard.getByRole('button', { name: 'Удалить' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Домашний компот' }),
  ).toHaveCount(0);
});

test('экспорт и импорт восстанавливают настройки из резервной копии', async ({
  page,
}) => {
  await openApp(page, '/#/settings');
  const goal = page.getByRole('spinbutton', { name: 'Цель, мл' });
  await goal.fill('2500');
  await page.getByRole('button', { name: 'Сохранить цель' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспортировать' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await goal.fill('3000');
  await page.getByRole('button', { name: 'Сохранить цель' }).click();
  await expect(goal).toHaveValue('3000');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await expect(page.getByRole('status')).toHaveText(
    'Резервная копия восстановлена',
  );
  await expect(goal).toHaveValue('2500');
});
