require('dotenv').config();
const sttService = require('./services/speechToText');
const fs = require('fs');

async function testSTT() {
    console.log('Testing STT Service Import and Method Existence...');
    try {
        if (typeof sttService.transcribe === 'function') {
            console.log('Success: sttService.transcribe is a function.');
        } else {
            console.error('Error: sttService.transcribe is NOT a function.');
        }
    } catch (error) {
        console.error('Error importing STT:', error);
    }
}

testSTT();
