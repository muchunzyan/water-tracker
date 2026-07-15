import { BUILTIN_DRINKS } from '../../domain/builtin-drinks';
import { filterDrinks } from './filter-drinks';

describe('filterDrinks', () => {
  it('ищет по части названия без учёта регистра', () => {
    expect(filterDrinks(BUILTIN_DRINKS, 'МИНЕРАЛЬНАЯ')).toEqual([
      expect.objectContaining({ name: 'Минеральная вода' }),
    ]);
  });

  it('считает е и ё эквивалентными', () => {
    expect(filterDrinks(BUILTIN_DRINKS, 'зеленый')).toEqual([
      expect.objectContaining({ name: 'Зелёный чай' }),
    ]);
  });

  it('возвращает весь список для пустого запроса', () => {
    expect(filterDrinks(BUILTIN_DRINKS, '  ')).toHaveLength(
      BUILTIN_DRINKS.length,
    );
  });
});
