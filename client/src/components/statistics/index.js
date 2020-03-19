import React from 'react';
import { Row, Col, FormGroup, Label } from 'reactstrap';
import { Bar, Line } from 'react-chartjs-2';
import ReactSelect from 'react-select';

const randomRgba = () => {
  const s = 255;
  return [
    Math.round(Math.random() * s),
    Math.round(Math.random() * s),
    Math.round(Math.random() * s),
  ];
}

const chartTypes = {
  BAR: 'BAR',
  LINE: 'LINE',
};

const chartTypeLabels = {
  [chartTypes.BAR]: 'Bar',
  [chartTypes.LINE]: 'Line',
};

const chartTypeComponents = {
  [chartTypes.BAR]: Bar,
  [chartTypes.LINE]: Line,
};

const statistics = {
  AGGREGATED_CASES: 'AGGREGATED_CASES',
  GROWTH_PER_DAY: 'GROWTH_PER_DAY',
};

const statisticLabels = {
  [statistics.AGGREGATED_CASES]: 'Aggregated cases',
  [statistics.GROWTH_PER_DAY]: 'Growth per day',
};

class Statistics extends React.Component {
  constructor(props) {
    super(props);

    this.offset = 4;
    this.apiUrl = window.location.href.substring(0, window.location.href.length - 1);
    this.apiUrl = 'http://localhost:3500';

    this.state = {
      loading: true,
      data: {},
      chartData: {},
      error: null,
      selectedCountries: ['Austria'],
      state: null,
      threshold: -1,
      countries: [],
      states: [],
      chartType: chartTypes.BAR,
      statistic: statistics.AGGREGATED_CASES,
    };

    this.countriesToColors = {};

    this.doAggregatedCases = this.doAggregatedCases.bind(this);
    this.doGrowthPerDay = this.doGrowthPerDay.bind(this);
    this.updateView = this.updateView.bind(this);
    this.fetchCountries = this.fetchCountries.bind(this);
    this.fetchStates = this.fetchStates.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }

  doAggregatedCases() {
    const { data: { dates, casesByCountry } } = this.state;

    const datasets = [];

    Object.entries(casesByCountry).forEach(([country, cases]) => {
      const color = this.countriesToColors[country] || randomRgba();
      if (!this.countriesToColors[country]) this.countriesToColors[country] = color;

      const countryDataset = {
        label: country,
        backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`,
        hoverBackgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`,
        borderWidth: 0,
        data: [],
      };
      cases.forEach(c => { countryDataset.data.push(c); });

      datasets.push(countryDataset);
    });

    this.setState({
      chartData: {
        labels: dates,
        datasets,
      },
    });
  }

  doGrowthPerDay() {
    const { data: { dates, casesByCountry } } = this.state;

    const datasets = [];

    Object.entries(casesByCountry).forEach(([country, cases]) => {
      const color = this.countriesToColors[country] || randomRgba();
      if (!this.countriesToColors[country]) this.countriesToColors[country] = color;

      const countryDataset = {
        label: country,
        backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`,
        hoverBackgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`,
        borderWidth: 0,
        data: [],
      };

      for (let i = 0; i < cases.length; i += 1) {
        if (i === 0) {
          countryDataset.data.push(0);
          continue;
        }
        countryDataset.data.push(cases[i] - cases[i - 1]);
      }

      datasets.push(countryDataset);
    });

    this.setState({
      chartData: {
        labels: dates,
        datasets,
      },
    });
  }

  updateView() {
    const { statistic } = this.state;

    switch (statistic) {
      case statistics.AGGREGATED_CASES:
        this.doAggregatedCases();
        break;
      case statistics.GROWTH_PER_DAY:
        this.doGrowthPerDay();
        break;
      default:
        break;
    }
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
    const { selectedCountries, state, threshold, statistic } = this.state;

    let dates = null;
    let casesByCountry = null;

    try {
      casesByCountry = await selectedCountries.reduce(async (prevPromise, country) => {
        const currentData = await prevPromise;
        let dataEndpoint = `${this.apiUrl}/${country}`;
        if (state) {
          dataEndpoint = `${dataEndpoint}/${state}`;
        };

        const rawResponse = await fetch(dataEndpoint);
        const jsonResponse = await rawResponse.json();

        const currentDates = [];
        const cases = [];

        const keys = Object.keys(jsonResponse[0]);
        const values = Object.values(jsonResponse[0]);

        for (let i = 4; i < keys.length; i += 1) {
          const value = parseInt(values[i], 10);
          if (value > threshold) {
            currentDates.push(keys[i]);
            cases.push(value);
          }
        }

        if (!dates) {
          dates = currentDates;
        }
        currentData[country] = cases;
        return Promise.resolve(currentData);
      }, Promise.resolve({}));
      this.setState({
        loading: false,
        data: {
          dates,
          casesByCountry,
        },
        error: null,
      }, () => { this.updateView(); });
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
      chartData,
      error,
      selectedCountries,
      countries,
      state,
      states,
      chartType,
      statistic,
    } = this.state;

    if (loading) {
      return <span>Loading ...</span>
    }
    if (error) {
      return <span>Error: {error.message}</span>;
    }

    const ChartComponent = chartTypeComponents[chartType];

    return (
      <Row>
        <Col xs={12}>
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
            <Col xs={12} sm={6}>
              <FormGroup>
                <Label htmlFor="statistic">Show:</Label>
                <ReactSelect
                  id="statistic"
                  options={[
                    { value: statistics.AGGREGATED_CASES, label: statisticLabels[statistics.AGGREGATED_CASES] },
                    { value: statistics.GROWTH_PER_DAY, label: statisticLabels[statistics.GROWTH_PER_DAY] },
                  ]}
                  value={{ value: statistic, label: statisticLabels[statistic] }}
                  onChange={({ value }) => {
                    this.setState({ statistic: value }, () => { this.updateView(); });
                  }}
                />
              </FormGroup>
            </Col>
            <Col xs={12} sm={6}>
              <FormGroup>
                <Label htmlFor="chartType">Chart Type:</Label>
                <ReactSelect
                  id="chartType"
                  options={[
                    { value: chartTypes.BAR, label: chartTypeLabels[chartTypes.BAR] },
                    { value: chartTypes.LINE, label: chartTypeLabels[chartTypes.LINE] },
                  ]}
                  value={{ value: chartType, label: chartTypeLabels[chartType] }}
                  onChange={({ value }) => {
                    this.setState({ chartType: value });
                  }}
                />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col>
              <h1>{selectedCountries.join(', ')}</h1>
              <ChartComponent
                data={chartData}
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
        </Col>
      </Row>
    );
  }
}

export default Statistics;
