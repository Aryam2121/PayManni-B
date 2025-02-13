const https = require('https');

const getTrains = (req, res) => {
  const { from, to, date, class: trainClass } = req.query;

  const options = {
    method: 'POST',
    hostname: 'trains.p.rapidapi.com',
    port: null,
    path: '/v1/railways/trains/india',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,  // Use environment variable for the API key
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
      try {
        const trains = JSON.parse(data);  // Parse the response
        const filteredTrains = trains.filter(train => 
          train.from === from && train.to === to
        );
        res.json(filteredTrains);  // Send filtered trains to the frontend
      } catch (error) {
        res.status(500).json({ message: 'Error parsing the response from API' });
      }
    });
  });

  request.on('error', (error) => {
    res.status(500).json({ message: 'Error fetching data from the API', error: error.message });
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
