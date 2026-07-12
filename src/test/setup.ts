import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  value(this: HTMLDialogElement) {
    this.open = true;
  },
});

Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  value(this: HTMLDialogElement) {
    this.open = false;
  },
});
