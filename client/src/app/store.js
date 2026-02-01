import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import testReducer from '../features/test/testSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        test: testReducer,
        ui: uiReducer,
    },
});
