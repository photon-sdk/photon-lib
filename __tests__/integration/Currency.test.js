import AsyncStorage from '@react-native-async-storage/async-storage';
import assert from 'assert';
import { Currency, FiatUnit } from '../../';

jest.useFakeTimers();

describe.skip('currency', () => {
  it('fetches exchange rate and saves to AsyncStorage', async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    await Currency.startUpdater();
    let cur = await AsyncStorage.getItem(Currency.EXCHANGE_RATES);
    cur = JSON.parse(cur);
    assert.ok(Number.isInteger(cur[Currency.STRUCT.LAST_UPDATED]));
    assert.ok(cur[Currency.STRUCT.LAST_UPDATED] > 0);
    assert.ok(cur.BTC_USD > 0);

    // now, setting other currency as default
    await AsyncStorage.setItem(Currency.PREFERRED_CURRENCY, JSON.stringify(FiatUnit.JPY));
    await Currency.startUpdater();
    cur = JSON.parse(await AsyncStorage.getItem(Currency.EXCHANGE_RATES));
    assert.ok(cur.BTC_JPY > 0);

    // now setting with a proper setter
    await Currency.setPrefferedCurrency(FiatUnit.EUR);
    await Currency.startUpdater();
    const preferred = await Currency.getPreferredCurrency();
    assert.strictEqual(preferred.endPointKey, 'EUR');
    cur = JSON.parse(await AsyncStorage.getItem(Currency.EXCHANGE_RATES));
    assert.ok(cur.BTC_EUR > 0);
  });
});
