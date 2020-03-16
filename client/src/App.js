import React from 'react';
import { Bar } from 'react-chartjs-2';
import ReactSelect from 'react-select';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.offset = 4;
    this.apiUrl = 'http://localhost:3500';

    this.state = {
      loading: true,
      data: [],
      error: null,
      country: 'Austria',
      state: null,
      threshold: 0,
      countries: [],
      states: [],
    };

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
    const { country } = this.state;
    if (country) {
      fetch(`${this.apiUrl}/${country}/states`)
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

  fetchData() {
    this.setState({ loading: true });
    const { country, state, threshold } = this.state;
    let dataEndpoint = `${this.apiUrl}/${country}`;
    if (state) {
      dataEndpoint = `${dataEndpoint}/${state}`;
    };
    fetch(dataEndpoint)
      .then(res => res.json())
      .then(
        result => {
          const data = {
            labels: [],
            datasets: [{
              label: 'Cases per day',
              backgroundColor: 'rgba(106, 27, 154, 0.5)',
              hoverBackgroundColor: 'rgba(106, 27, 154, 1)',
              borderWidth: 0,
              data: [],
            }],
          };
          const keys = Object.keys(result[0]);
          const values = Object.values(result[0]);

          for (let i = 4; i < keys.length; i += 1) {
            const value = parseInt(values[i], 10);
            if (value > threshold) {
              console.log(`${keys[i]}: `, value);
              data.labels.push(keys[i]);
              data.datasets[0].data.push(value);
            }
          }

          this.setState({
            loading: false,
            data,
          });
        },
        error => {
          this.setState({
            loading: false,
            error,
          });
        }
      );
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
      country,
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
        <label htmlFor="country">Country:</label>
        <ReactSelect
          id="country"
          options={countries.map(c => ({ value: c, label: c }))}
          value={{ value: country, label: country }}
          onChange={({ value }) => {
            this.setState({ country: value, state: null }, () => {
              this.fetchStates();
              this.fetchData();
            });
          }}
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
        />
        <h1>{country}</h1>
        <Bar
          data={data}
          width={150}
          height={50}
          options={{
            maintainAspectRatio: true,
          }}
        />
      </div>
    );
  }
}

export default App;
