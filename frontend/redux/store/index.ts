import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { 
  persistStore, 
  persistReducer, 
  FLUSH, 
  REHYDRATE, 
  PAUSE, 
  PERSIST, 
  PURGE, 
  REGISTER 
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
// Import từ file index thay vì trực tiếp từ file module
import authReducer from '../slices';
import { authApi, stripeApi, restaurantApi, chatApi } from '../api';
import { userApi } from '../api/userApi';
import { orderApi } from '../api/order';
import { orderDetailApi } from '../api/orderDetail';
import { reservationApi } from '../api/reservationApi';
import { tableApi } from '../api/tableApi';
import { reservedTableApi } from '../api/reservedTableApi';
import { deliveryApi } from '../api/deliveryApi';
import userReducer from '../slices/userSlice';
import validateTokenApi from '../api/validateTokenApi';
import { categoryApi } from '../api/categoryApi';
import { menuItemApi } from '../api/menuItems';
import { statsApi } from '../api/statsApi';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart'], // only auth and cart will be persisted
};

const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [stripeApi.reducerPath]: stripeApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [orderDetailApi.reducerPath]: orderDetailApi.reducer,
  [restaurantApi.reducerPath]: restaurantApi.reducer,
  [validateTokenApi.reducerPath]: validateTokenApi.reducer,
  [reservationApi.reducerPath]: reservationApi.reducer,
  [tableApi.reducerPath]: tableApi.reducer,
  [reservedTableApi.reducerPath]: reservedTableApi.reducer,
  [deliveryApi.reducerPath]: deliveryApi.reducer,
  user: userReducer,
  [categoryApi.reducerPath]: categoryApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [menuItemApi.reducerPath]: menuItemApi.reducer,
  [statsApi.reducerPath]: statsApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware, 
      stripeApi.middleware, 
      userApi.middleware, 
      orderApi.middleware,
      orderDetailApi.middleware,
      restaurantApi.middleware,
      validateTokenApi.middleware,
      reservationApi.middleware,
      tableApi.middleware,
      reservedTableApi.middleware,
      deliveryApi.middleware,
      categoryApi.middleware,
      chatApi.middleware,
      menuItemApi.middleware,
      statsApi.middleware,
    ),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
