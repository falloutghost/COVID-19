import React from 'react';
import { Container } from 'reactstrap';

import Statistics from './components/statistics';
import Map from './components/map';

const App = () => (
  <Container fluid>
    <Map />
    {/* <Statistics /> */}
  </Container>
);

export default App;
