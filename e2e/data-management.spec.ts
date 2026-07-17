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
  await page.getByRole('button', { name: 'Изменить' }).click();
  await page.getByRole('spinbutton', { name: 'Выпито, мл' }).fill('500');
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();

  await expect(
    page.getByRole('img', { name: 'Выполнено 19% дневной цели' }),
  ).toBeVisible();
  await expect(page.getByText('500 мл', { exact: true })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Удалить' }).click();
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
