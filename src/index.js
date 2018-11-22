import {batchGeoCoding, batchGeoOdCoding, batchGeoBoundaryCoding, batchGeoBoundaryCodingMas} from './geocoding.js';
import utils from './utils.js';
import Papa from 'papaparse';
import XLSX from 'xlsx';

export default class DataSetManager {

    constructor(options) {
        this.options = options || {};
        this.data = {};
        this.csvString = "";
    }

    importCSV(csvString) {
        this.csvString = csvString;
        let csv = Papa.parse(csvString, {
        	skipEmptyLines: 'greedy',
            header: true
        });
        this.data = csv;
        return this;
    }

    getCsvString() {
        return this.csvString;
    }

    importJSON(json) {
        console.log(json);
        let csv = Papa.unparse(json);
        console.log(csv);
        this.importCSV(csv);
    }

    importXLSX(binary) {
        let workbook = XLSX.read(binary, {
            type: 'binary'
        });
        let csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        this.importCSV(csv);
        return this;
    }

    /**
     * 解析点坐标数据
     * @param {string} lngColumnName 点坐标经度列名
     * @param {string} latColumnName 点坐标纬度列名
     * @param {string} countColumnName 权重列名
     */
    geoPoint(lngColumnName, latColumnName, countColumnName) {
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

    /**
     * 解析点位置数据
     * @param {string} addrColumnName 地址列名
     * @param {string} countColumnName 权重列名
     */
    geoAddress(addrColumnName, countColumnName, callback) {
        let data = this.data.data;
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
     * 解析线坐标数据
     * @param {string} lngStartColumnName 起点坐标经度列名
     * @param {string} latStartColumnName 起点坐标纬度列名
     * @param {string} lngEndColumnName 终点坐标经度列名
     * @param {string} latEndColumnName 终点坐标纬度列名
     * @param {string} countColumnName 权重列名
     */
    geoLine(lngStartColumnName, latStartColumnName, lngEndColumnName, latEndColumnName, countColumnName) {
        let data = this.data.data;
        for (let i = 0; i < data.length; i++) {
            data[i].geometry = {
                type: 'LineString',
                coordinates: [
                    [data[i][lngStartColumnName], data[i][latStartColumnName]],
                    [data[i][lngEndColumnName], data[i][latEndColumnName]],
                ]
            };
            data[i].count = parseFloat(data[i][countColumnName]) || 1;
        }
        return this;
    }

    /**
     * 解析线坐标串数据
     * @param {string} positionColumnName 坐标字符串列名
     * @param {string} countColumnName 权重列名
     */
    geoLineString(positionColumnName, countColumnName) {
        let data = this.data.data;
        for (let i = 0; i < data.length; i++) {
            data[i].geometry = {
                type: 'LineString',
                coordinates: utils.formatLineStringCoordinates(data[i][positionColumnName])
            };
            data[i].count = parseFloat(data[i][countColumnName]) || 1;
        }
        return this;
    }

    /**
     * 解析线坐标串数据
     * @param {string} positionColumnName 坐标字符串列名
     * @param {string} countColumnName 权重列名
     */
    geoMultiLineString(positionColumnName, countColumnName) {
        let data = this.data.data;
        for (let i = 0; i < data.length; i++) {
            data[i].geometry = {
                type: 'MultiLineString',
                coordinates: utils.formatMultiLineStringCoordinates(data[i][positionColumnName])
            };
            data[i].count = parseFloat(data[i][countColumnName]) || 1;
        }
        return this;
    }

    /**
     * 解析线地址数据
     * @param {string} fromColumnName 起点列名
     * @param {string} fromColumnName 终点列名
     * @param {string} countColumnName 权重列名
     */
    geoOd(fromColumnName, toColumnName, countColumnName, callback) {
        let data = this.data.data;
        batchGeoOdCoding(data.map((item) => {
            return {
                start: item[fromColumnName],
                end: item[toColumnName],
                count: item[countColumnName]
            };
        }), (rs) => {
            for (let i = 0; i < data.length; i++) {
                data[i].geocoding = rs[i];
                if (data[i].geocoding 
                    && data[i].geocoding.from && data[i].geocoding.from.location
                    && data[i].geocoding.to && data[i].geocoding.to.location
                    && data[i].geocoding.params) {
                    let {from, to, params} = data[i].geocoding;
                    data[i].geometry = {
                        type: 'LineString',
                        coordinates: [
                            [from.location.lng, from.location.lat],
                            [to.location.lng, to.location.lat]
                        ]
                    };
                    data[i].count = parseFloat(params.count) || 1;
                }
            }
            callback && callback(data);
        });
    }

    /**
     * 解析面坐标串数据
     * @param {string} positionColumnName 坐标字符串列名
     * @param {string} countColumnName 权重列名
     */
    geoPolygon(positionColumnName, countColumnName) {
        let data = this.data.data;
        for (let i = 0; i < data.length; i++) {
            data[i].geometry = {
                type: 'Polygon',
                coordinates: utils.formatPolygonCoordinates(data[i][positionColumnName])
            };
            data[i].count = parseFloat(data[i][countColumnName]) || 1;
        }
        return this;
    }

    /**
     * 解析面行政区名数据
     * @param {string} boundaryColumnName 行政区列名
     * @param {string} countColumnName 权重列名
     */
    geoBoundary(boundaryColumnName, countColumnName, callback) {
        let data = this.data.data;
        // 因为批量解析无法注入params，所以判断若没有count传入，则批量解析
        if (!countColumnName) {
            batchGeoBoundaryCodingMas(data.map((item) => {
                return item[boundaryColumnName];
            }) , rs => {
                for (let i = 0; i < data.length; i++) {
                    data[i].geocoding = rs[i];
                    if (data[i].geocoding && data[i].geocoding.bounds) {
                        let {bounds} = data[i].geocoding;
                        data[i].geometry = {
                            type: 'Polygon',
                            coordinates: utils.formatPolygonCoordinates(bounds)
                        };
                        data[i].count = 1;
                    }
                }
                callback && callback(data);
            });
        } else {
            batchGeoBoundaryCoding(data.map((item) => {
                return {
                    name: item[boundaryColumnName],
                    count: item[countColumnName]
                };
            }) , rs => {
                for (let i = 0; i < data.length; i++) {
                    data[i].geocoding = rs[i];
                    if (data[i].geocoding && data[i].geocoding.bounds && data[i].geocoding.params) {
                        let {bounds, params} = data[i].geocoding;
                        data[i].geometry = {
                            type: 'Polygon',
                            coordinates: utils.formatPolygonCoordinates(bounds)
                        };
                        data[i].count = parseFloat(params.count) || 1;
                    }
                }
                callback && callback(data);
            });
        }
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
