import batchGeoCoding from './geocoding.js';
import Papa from 'papaparse';
import XLSX from 'xlsx';

export default class DataSetManager {

    constructor(options) {
        this.options = options || {};
        this.data = {};
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

    geoPointWithCount(lngColumnName, latColumnName, countColumnName) {
        let data = this.data.data;
        for (let i = 0; i < data.length; i++) {
            data[i].geometry = {
                type: 'Point',
                coordinates: [data[i][lngColumnName], data[i][latColumnName]]
            };
            data[i].count = parseFloat(data[i][countColumnName]) || 1;
        }
        return this;
    }

    geoAddress(columnName, callback) {
        let data = this.data.data;
        console.log('geoAddress');
        batchGeoCoding(data.map((item) => {
            return {
                name: item[columnName]
            };
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

    geoAddressWithCount(addrColumnName, countColumnName, callback) {
        let data = this.data.data;
        console.log('geoAddress');
        batchGeoCoding(data.map((item) => {
            return {
                name: item[addrColumnName],
                count: item[countColumnName]
            };
        }), (rs) => {
            for (let i = 0; i < data.length; i++) {
                data[i].geocoding = rs[i];
                if (data[i].geocoding && data[i].geocoding.location && data[i].geocoding.params) {
                    let {location, params} = data[i].geocoding;
                    data[i].geometry = {
                        type: 'Point',
                        coordinates: [location.lng, location.lat]
                    };
                    data[i].count = parseFloat(params.count) || 1;
                }
            }
            callback && callback(data);
        });
    }

    /**
     * 拷贝数据列
     * @param {string} fromColumn 源列字段
     * @param {string} toColumn 目标列字段
     */
    copyColumn(fromColumn, toColumn) {
        if (this.data.data) {
            this.data.data.forEach((item) => {
                item[toColumn] = item[fromColumn];
            });
        }
        return this;
    }

    /**
     * 返回所有数据集对象
     * @return {array} 数据集数组
     */
    getData() {
        return this.data.data;
    }

    /**
     * @return {array} 返回带地理位置的数据
     */
    getGeoData() {
        return this.data.data.filter((item) => {
            if (item.geometry) {
                return true;
            }
        });
    }

    getFields() {
        return this.data.meta.fields;
    }

}
