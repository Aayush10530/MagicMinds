const https = require('https');

const options = {
    hostname: 'magicminds.up.railway.app',
    port: 443,
    path: '/api/voice/tts',
    method: 'OPTIONS',
    headers: {
        'Origin': 'https://magicminds.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization'
    }
};

const req = https.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e);
});

req.end();
