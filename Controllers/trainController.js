// controllers/trainController.js
const https = require('https');

const getTrains = (req, res) => {
  const { from, to, date, class: trainClass } = req.query;

  const options = {
    method: 'POST',
    hostname: 'trains.p.rapidapi.com',
    port: null,
    path: '/v1/railways/trains/india',
    headers: {
      'x-rapidapi-key': 'aef7d418bemsh6e5815a7bf75a54p1db7f0jsnb9ddbd44c9d0',
      'x-rapidapi-host': 'trains.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      const trains = JSON.parse(data);  // Parse the response
      const filteredTrains = trains.filter(train => 
        train.from === from && train.to === to
      );
      res.json(filteredTrains);  // Send filtered trains to the frontend
    });
  });

  const requestData = {
    search: 'Rajdhani',
    date: date,
    class: trainClass,
  };

  request.write(JSON.stringify(requestData));  // Sending request data
  request.end();
};

module.exports = { getTrains };
