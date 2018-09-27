var http=require('http');

window.fetchJsonpTest = window.fetch = jest.fn().mockImplementation((url) => {
    return Promise.resolve({
        status: 0,
        ok: true,
        result: {
            location: {
                lng: 108.9763607986826,
                lat: 34.2682711990115
            },
            precise: 0,
            confidence: 60,
            comprehension: 87,
            level: "地产小区"
        }
    });
});

import DataSetManager from '../src/index.js';
import fs from 'fs';

let csvPoint = fs.readFileSync('test/data/point.csv', 'utf8');
let xlsPoint = fs.readFileSync('test/data/point.xls', 'binary');

let dataSetManager = new DataSetManager();

test('csv', () => {
    dataSetManager.importCSV(csvPoint);
    expect(dataSetManager.getData().length === 100).toBe(true);
});

test('xlsx', () => {
    let data = dataSetManager.importXLSX(xlsPoint);
});

test('point', () => {
    let data = dataSetManager.geoPoint();
});

test('address', () => {
    let addressStr = fs.readFileSync('test/data/address.xlsx', 'binary');
    dataSetManager.importXLSX(addressStr);
    let data = dataSetManager.geoAddress('address1', (res) => {
        console.log(res);
    });
});
