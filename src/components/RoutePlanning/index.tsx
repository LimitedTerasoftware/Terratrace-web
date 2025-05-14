import React from 'react';
import { MapComponent } from './MapComponent';
import Layout from './Layout';
import { AppProvider } from './AppContext';

function RoutePlanning() {

  return (
    <AppProvider>
    <Layout>
     <MapComponent />
    </Layout>
    </AppProvider>
  );
}

export default RoutePlanning;