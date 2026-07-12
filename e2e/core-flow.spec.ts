import { expect, test } from '@playwright/test';

test('первый запуск показывает пустой текущий день и встроенные напитки', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Добр');
  await expect(page.getByText('Сегодня записей пока нет')).toBeVisible();
  await page.getByRole('link', { name: 'Напитки' }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Вода' }),
  ).toBeVisible();
});

test('пользователь создаёт напиток и добавляет его в сегодняшний день', async ({
  page,
}) => {
  await page.goto('/#/drinks');
  await page.getByRole('button', { name: 'Новый напиток' }).click();
  await page.getByRole('textbox', { name: 'Название' }).fill('Какао');
  await page.getByRole('spinbutton', { name: 'Гидратация, %' }).fill('85');
  await page
    .getByRole('spinbutton', { name: 'Стандартная порция, мл' })
    .fill('300');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(
    page.getByRole('heading', { level: 2, name: 'Какао' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Сегодня' }).click();
  await page.getByRole('button', { name: 'Добавить напиток' }).click();
  await page
    .getByRole('combobox', { name: 'Напиток', exact: true })
    .selectOption({ label: 'Какао · 85%' });
  await page.getByRole('button', { name: '330 мл' }).click();
  await expect(page.getByText('281 мл', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить запись' }).click();

  await expect(
    page.getByRole('heading', { level: 3, name: 'Какао' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Выполнено 14% дневной цели' }),
  ).toBeVisible();
});

test('пользователь меняет дневную цель и тему', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('spinbutton', { name: 'Цель, мл' }).fill('2500');
  await page.getByRole('button', { name: 'Сохранить цель' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Дневная цель сохранена',
  );

  await page.getByRole('radio', { name: 'Тёмная' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Цель, мл' })).toHaveValue(
    '2500',
  );
  await expect(page.getByRole('radio', { name: 'Тёмная' })).toBeChecked();
});
