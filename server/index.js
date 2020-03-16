const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const csvParser = require('csv-parser');

const filename = '../csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv';

const app = express();
app.use(cors());
app.use('/', express.static(path.join(__dirname, '../client/build')));

const getSingleColumn = ({ column, includeEmpty = false, avoidDuplicates = true }) => {
  const results = [];
  return new Promise((resolve) => {
    fs.createReadStream(path.join(__dirname, filename))
    .pipe(csvParser({
      mapHeaders: ({ header, index }) => {
        if (header === column) {
          return header;
        }
        return null;
      }
    }))
    .on('data', data => {
      const value = data[Object.keys(data)[0]];
      if (
        (includeEmpty || value) &&
        (!avoidDuplicates || results.indexOf(value) === -1)
      ) {
        results.push(value);
      }
    })
    .on('end', () => {
      resolve(results);
    });
  });
};

app.get('/countries', (req, res) => {
  getSingleColumn({ column: 'Country/Region' }).then(results => res.json(results));
});

app.get('/states', (req, res) => {
  getSingleColumn({ column: 'Province/State' }).then(results => res.json(results));
})

app.get('/:country/states', (req, res) => {
  const results = [];

  fs.createReadStream(path.join(__dirname, filename))
  .pipe(csvParser())
  .on('data', data => {
    if (data['Country/Region'].toLowerCase() === req.params.country.toLowerCase()) {
      results.push(data['Province/State']);
    }
  })
  .on('end', () => {
    res.json(results);
  });
});

app.get('/:country/:state', (req, res) => {
  const results = [];
  
  fs.createReadStream(path.join(__dirname, filename))
    .pipe(csvParser())
    .on('data', data => {
      if (
        data['Country/Region'].toLowerCase() === req.params.country.toLowerCase() &&
        data['Province/State'].toLowerCase() === req.params.state.toLowerCase()
      ) {
        results.push(data);
      }
    })
    .on('end', () => {
      res.json(results);
    });
});

app.get('/:country', (req, res) => {
  const results = [];
  
  fs.createReadStream(path.join(__dirname, filename))
    .pipe(csvParser())
    .on('data', data => {
      if (data['Country/Region'].toLowerCase() === req.params.country.toLowerCase()) {
        results.push(data);
      }
    })
    .on('end', () => {
      res.json(results);
    });
});

app.listen(3500, () => {
  console.log('Listening ...');
});
