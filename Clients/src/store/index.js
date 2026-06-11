import { configureStore } from '@reduxjs/toolkit';
import projectsReducer  from './projectsSlice';
import inventoryReducer from './inventorySlice';

const store = configureStore({
  reducer: {
    projects:  projectsReducer,
    inventory: inventoryReducer,
  },
});

export default store;
