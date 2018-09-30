(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fetch-jsonp'), require('papaparse'), require('xlsx')) :
    typeof define === 'function' && define.amd ? define(['fetch-jsonp', 'papaparse', 'xlsx'], factory) :
    (global.DataSetManager = factory(global.fetchJsonp,global.Papa,global.XLSX));
}(this, (function (fetchJsonp,Papa,XLSX) { 'use strict';

    fetchJsonp = fetchJsonp && fetchJsonp.hasOwnProperty('default') ? fetchJsonp['default'] : fetchJsonp;
    Papa = Papa && Papa.hasOwnProperty('default') ? Papa['default'] : Papa;
    XLSX = XLSX && XLSX.hasOwnProperty('default') ? XLSX['default'] : XLSX;

    let fetch = fetchJsonp;

    function getPoint(name, callback) {
        let ak = "49tGfOjwBKkG9zG76wgcpIbce4VZdbv6";
        let address = encodeURIComponent(name);
        // 不支持跨域，需要使用JSONP
        let geoCodingUrl = `http://api.map.baidu.com/geocoder/v2/?address=${address}&output=json&ak=${ak}&callback=?`;

        if (window.fetchJsonpTest) {
            fetch = window.fetchJsonpTest;
        }

        fetch(geoCodingUrl, {

            credentials: "include",
            // timeout: 3000,
            // jsonpCallback: null,
            // jsonCallbackFunction: null,
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        })
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error('response not ok');
            }
        })
        .then(res => {
            if (res && res.status == 0 && res.result) {
                let ret = res.result;
                ret['name'] = name;
                callback && callback(ret);
            } else {
                console.log(res);
                throw (new Error(res));
            }
            return res;
        })
        .catch(error => {
            console.log("failed", error);
            // console.log(name, "failed", error);
            callback && callback(null);
            // throw (error);
        });
    }

    function batchGeoCoding(nameList, callback) {
        let poiList = [];
        poiList.length = nameList.length;
        let cnts = 0;
        let cnte = 0;
        nameList.map((name, index) => {
            cnts++;
            getPoint(name, (poiInfo) => {
                cnte++;
                if (poiInfo) {
                    poiList[index] = poiInfo;
                }
                if (cnte == cnts) {
                    callback && callback(poiList);
                }
            });
        });
    }

    class DataSetManager {

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

    return DataSetManager;

})));
