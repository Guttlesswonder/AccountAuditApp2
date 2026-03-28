import { describe, expect, it } from 'vitest';
import { workbookForAccount } from './exportExcel';
import { createInitialState } from './state';

describe('excel export', () => {
  it('builds workbook tabs', () => {
    const wb = workbookForAccount(createInitialState().accounts[0]);
    expect(wb.SheetNames).toContain('Summary');
    expect(wb.SheetNames).toContain('Commercial & Terms');
  });
});
