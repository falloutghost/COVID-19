import React from 'react';
import { Container, Row, Col, FormGroup, Label } from 'reactstrap';
import { Bar } from 'react-chartjs-2';
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
    } catch (error) {
      this.setState({
        loading: false,
        data: {},
        error,
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
      <Container fluid>
        <Row>
          <Col xs={12} sm={6}>
            <FormGroup>
              <Label htmlFor="selectedCountries">Country:</Label>
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
            </FormGroup>
          </Col>
          <Col xs={12} sm={6}>
            <FormGroup>
              <Label htmlFor="state">State:</Label>
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
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            <h1>{selectedCountries.join(', ')}</h1>
            <Bar
              data={data}
              width={150}
              height={50}
              options={{
                maintainAspectRatio: true,
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            Data taken from <a href="https://github.com/CSSEGISandData/COVID-19">CSSEGISandData/COVID-19</a>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
