import React from 'react';
import mapboxgl from 'mapbox-gl';

import { getCircleData } from './util';

mapboxgl.accessToken = 'pk.eyJ1IjoiZmFsbG91dGdoc3QiLCJhIjoiY2puNHdwYm5jMHZvbjNxczAyN3RtbDYwNCJ9.a2arzh0CIUgpLWlXCkApmw';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.apiUrl = window.location.href.substring(0, window.location.href.length - 1);
    this.apiUrl = 'http://localhost:3500';

    this.state = {
      lng: 5,
      lat: 34,
      zoom: 2,
      loading: true,
      data: null,
      error: null,
    };

    this.fetchData = this.fetchData.bind(this);
    this.showCurrentCases = this.showCurrentCases.bind(this);
  }

  componentDidMount() {
    // init map
    const { lng, lat, zoom } = this.state;
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom,
    });

    this.fetchData().then(() => {
      this.showCurrentCases();
    });
  }

  async fetchData() {
    this.setState({ loading: true });

    const dataEndpoint = `${this.apiUrl}/map-data`;

    return new Promise(async (resolve, reject) => {
      try {
        const rawResponse = await fetch(dataEndpoint);
        const jsonResponse = await rawResponse.json();
        console.log(jsonResponse);
  
        this.setState({
          loading: false,
          data: jsonResponse,
          error: null,
        }, () => { resolve(); });
      } catch (error) {
        this.setState({
          loading: false,
          data: null,
          error,
        }, () => { reject(); });
      }
    });
  }

  showCurrentCases() {
    const { data } = this.state;

    this.map.addSource('points', {
      type: 'geojson',
      data,
    });
  }

  render() {
    const { data, error } = this.state;

    if (error) {
      return <div>Error: {error.message}</div>;
    }

    return (
      <div
        ref={ref => { this.mapContainer = ref; }}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
}

export default App;
