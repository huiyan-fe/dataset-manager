import batchGeoCoding from './geocoding.js';
import Papa from 'papaparse';
import XLSX from 'xlsx';

export default class DataSetManager {

    constructor(options) {
    }

    importCSV(csvString) {
        let csv = Papa.parse(csvString, {
        	skipEmptyLines: true,
            header: true
        });
        this.data = csv;
        return this;
    }

    importXLSX(binary) {
        let workbook = XLSX.read(binary, {
            type: 'binary'
        });
        let csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        this.importCSV(csv);
        return this;
    }

    geoPoint(lngColumnName, latColumnName) {
        let data = this.data.data;
        for (let i = 0; i < data.length; i++) {
            data[i].geometry = {
                type: 'Point',
                coordinates: [data[i][lngColumnName], data[i][latColumnName]]
            };
        }
        return this;
    }

    geoAddress(columnName, callback) {
        let data = this.data.data;
        console.log('geoAddress');
        batchGeoCoding(data.map((item) => {
            return item[columnName];
        }), (rs) => {
            for (let i = 0; i < data.length; i++) {
                data[i].geocoding = rs[i];
                if (data[i].geocoding && data[i].geocoding.location) {
                    let location = data[i].geocoding.location;
                    data[i].geometry = {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    };
                }
            }
            callback && callback(data);
        });
    }

    getData() {
        return this.data.data;
    }

    getFields() {
        return this.data.fields;
    }

}
