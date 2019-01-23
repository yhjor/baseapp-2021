import MockAdapter from 'axios-mock-adapter';
import { MockStoreEnhanced } from 'redux-mock-store';
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga';
import { rootSaga } from '..';
import { setupMockAxios, setupMockStore } from '../../helpers/jest';
import { getTimezone, setTimezone } from '../../helpers/timezone';
import { Market } from '../markets';
import { recentTradesFetch } from './actions';
import { RECENT_TRADES_DATA, RECENT_TRADES_ERROR, RECENT_TRADES_FETCH } from './constants';

// tslint:disable no-any no-magic-numbers
const debug = false;

describe('Trades module', () => {
    let store: MockStoreEnhanced;
    let sagaMiddleware: SagaMiddleware<{}>;
    let mockAxios: MockAdapter;
    let originalTz: string;

    beforeEach(() => {
        originalTz = getTimezone();
        setTimezone('Europe/Paris');
        mockAxios = setupMockAxios();
        sagaMiddleware = createSagaMiddleware();
        store = setupMockStore(sagaMiddleware, debug)();
        sagaMiddleware.run(rootSaga);
    });

    afterEach(() => {
        mockAxios.reset();
        setTimezone(originalTz);
    });

    const fakeTrades = [
        {
            id: 162413,
            price: '0.01',
            volume: '0.059',
            funds: '0.00059',
            market: 'bchbtc',
            created_at: '2018-12-18T14:21:23+01:00',
            side: 'ask',
        },
        {
            id: 162412,
            price: '0.01',
            volume: '0.01',
            funds: '0.0001',
            market: 'bchbtc',
            created_at: '2018-12-18T14:21:23+01:00',
            side: 'bid',
        },
        {
            id: 162411,
            price: '0.05',
            volume: '0.01',
            funds: '0.0005',
            market: 'bchbtc',
            created_at: '2018-12-18T14:21:23+01:00',
            side: 'bid',
        },
    ];

    const userTradesError = {
        error: {
            code: 500,
            message: 'Cannot fetch trades',
        },
    };

    const mockOrders = () => {
        mockAxios.onGet('/public/markets/xrpbtc/trades').reply(200, fakeTrades);
    };

    const mockOrdersError = () => {
        mockAxios.onGet('/public/markets/xrpbtc/trades').reply(500, userTradesError);
    };

    const currentMarket: Market = {
        name: 'XRP/BTC',
        id: 'xrpbtc',
    };

    const expectTradesFetch = { payload: currentMarket, type: RECENT_TRADES_FETCH };
    const expectedTradesData = {
        type: RECENT_TRADES_DATA,
        payload: [
            {
                id: 162413,
                price: '0.01',
                volume: '0.059',
                funds: '0.00059',
                market: 'bchbtc',
                created_at: '2018-12-18T14:21:23+01:00',
                side: 'ask',
            },
            {
                id: 162412,
                price: '0.01',
                volume: '0.01',
                funds: '0.0001',
                market: 'bchbtc',
                created_at: '2018-12-18T14:21:23+01:00',
                side: 'bid',
            },
            {
                id: 162411,
                price: '0.05',
                volume: '0.01',
                funds: '0.0005',
                market: 'bchbtc',
                created_at: '2018-12-18T14:21:23+01:00',
                side: 'bid',
            },
        ],
    };

    describe('working scenario', () => {
        const expectedTradesError = {
            type: RECENT_TRADES_ERROR,
            error: {
                code: 500,
                message: 'Cannot fetch trades',
            },
        };

        it('should fetch trades', async () => {
            mockOrders();
            const promise = new Promise(resolve => {
                store.subscribe(() => {
                    const actions = store.getActions();
                    if (actions.length === 2) {
                        expect(actions[0]).toEqual(expectTradesFetch);
                        expect(actions[1]).toEqual(expectedTradesData);
                        resolve();
                    }
                });
            });

            store.dispatch(recentTradesFetch(currentMarket));
            return promise;
        });

        it('should handle fetch orders error', async () => {
            mockOrdersError();
            const promise = new Promise(resolve => {
                store.subscribe(() => {
                    const actions = store.getActions();
                    if (actions.length === 2) {
                        expect(actions[0]).toEqual(expectTradesFetch);
                        expect(actions[1]).toEqual(expectedTradesError);
                        resolve();
                    }
                });
            });
            store.dispatch(recentTradesFetch(currentMarket));
            return promise;
        });
    });

});
