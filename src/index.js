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
        
    }

    /**
     * 解析线位置数据
     * @param {string} startColumnName 起点位置列名
     * @param {string} endColumnName 终点位置列名
     * @param {string} countColumnName 权重列名
     */
    geoRoute(startColumnName, endColumnName, countColumnName, callback) {
        
    }

    /**
     * 解析面坐标串数据
     * @param {string} positionColumnName 坐标字符串列名
     * @param {string} countColumnName 权重列名
     */
    geoPolygon(positionColumnName, countColumnName) {

    }

    /**
     * 解析面位置数据
     * @param {string} areaColumnName 面位置列名
     * @param {string} countColumnName 权重列名
     */
    geoArea(areaColumnName, countColumnName, callback) {

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
