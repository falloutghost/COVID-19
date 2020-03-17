import React from 'react';
import { Line } from 'react-chartjs-2';
import ReactSelect from 'react-select';

const randomRgba = () => {
  const s = 255;
  return [
    Math.round(Math.random() * s),
    Math.round(Math.random() * s),
    Math.round(Math.random() * s),
  ];
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.offset = 4;
    this.apiUrl = window.location.href.substring(0, window.location.href.length - 1);

    this.state = {
      loading: true,
      data: {},
      error: null,
      selectedCountries: ['Austria'],
      state: null,
      threshold: -1,
      countries: [],
      states: [],
    };

    this.countriesToColors = {};

    this.fetchCountries = this.fetchCountries.bind(this);
    this.fetchStates = this.fetchStates.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }

  fetchCountries() {
    fetch(`${this.apiUrl}/countries`)
      .then(res => res.json())
      .then(
        result => {
          this.setState({ countries: result });
        },
        error => {
          this.setState({ error });
        }
      );
  }

  fetchStates() {
    const { selectedCountries } = this.state;
    if (selectedCountries && selectedCountries.length === 1) {
      fetch(`${this.apiUrl}/${selectedCountries[0]}/states`)
        .then(res => res.json())
        .then(
          result => {
            this.setState({ states: result });
          },
          error => {
            this.setState({ error });
          }
        );
    }
  }

  async fetchData() {
    this.setState({ loading: true });
    const { selectedCountries, state, threshold } = this.state;

    let labels = null;
    let datasets = null;

    try {
      datasets = await selectedCountries.reduce(async (prevPromise, country) => {
        const currentDatasets = await prevPromise;
        let dataEndpoint = `${this.apiUrl}/${country}`;
        if (state) {
          dataEndpoint = `${dataEndpoint}/${state}`;
        };

          const rawResponse = await fetch(dataEndpoint);
          const jsonResponse = await rawResponse.json();

          const color = this.countriesToColors[country] || randomRgba();
          if (!this.countriesToColors[country]) this.countriesToColors[country] = color;

          const countryLabels = [];
          const countryDataset = {
            label: country,
            backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`,
            hoverBackgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`,
            borderWidth: 0,
            data: [],
          };

          const keys = Object.keys(jsonResponse[0]);
          const values = Object.values(jsonResponse[0]);

          for (let i = 4; i < keys.length; i += 1) {
            const value = parseInt(values[i], 10);
            if (value > threshold) {
              countryLabels.push(keys[i]);
              countryDataset.data.push(value);
            }
          }

          if (!labels) {
            labels = countryLabels;
          }
          currentDatasets.push(countryDataset);
          return Promise.resolve(currentDatasets);
      }, Promise.resolve([]));
      this.setState({
        loading: false,
        data: {
          labels,
          datasets,
        },
        error: null,
      });
    } catch (e) {
      this.setState({
        loading: false,
        data: {},
        error: e.message,
      });
    }
  }

  componentDidMount() {
    this.fetchCountries();
    this.fetchData();
  }

  render() {
    const {
      loading,
      data,
      error,
      selectedCountries,
      countries,
      state,
      states,
    } = this.state;

    if (loading) {
      return <span>Loading ...</span>
    }
    if (error) {
      return <span>Error: {error.message}</span>;
    }
    return (
      <div style={{ padding: '10px' }}>
        <label htmlFor="selectedCountries">Country:</label>
        <ReactSelect
          id="selectedCountries"
          options={countries.map(c => ({ value: c, label: c }))}
          value={selectedCountries.map(c => ({ value: c, label: c }))}
          onChange={(values) => {
            if (!values) {
              this.setState({ selectedCountries: [], state: null, data: {} });
            } else {
              this.setState({ selectedCountries: values.map(c => c.value), state: null }, () => {
                this.fetchStates();
                this.fetchData();
              });
            }
          }}
          isMulti
        />
        <label htmlFor="state">State:</label>
        <ReactSelect
          id="state"
          options={states.map(state => ({ value: state, label: state }))}
          value={{ value: state, label: state }}
          onChange={({ value }) => {
            this.setState({ state: value }, () => {
              this.fetchData();
            });
          }}
          disabled={!selectedCountries || selectedCountries.length !== 1}
        />
        <h1>{selectedCountries.join(', ')}</h1>
        <Line
          data={data}
          width={150}
          height={50}
          options={{
            maintainAspectRatio: true,
          }}
        />
        Data taken from <a href="https://github.com/CSSEGISandData/COVID-19">CSSEGISandData/COVID-19</a>
      </div>
    );
  }
}

export default App;
