(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fetch-jsonp'), require('papaparse'), require('xlsx')) :
  typeof define === 'function' && define.amd ? define(['fetch-jsonp', 'papaparse', 'xlsx'], factory) :
  (global.DataSetManager = factory(global.fetchJsonp,global.Papa,global.XLSX));
}(this, (function (fetchJsonp,Papa,XLSX) { 'use strict';

  fetchJsonp = fetchJsonp && fetchJsonp.hasOwnProperty('default') ? fetchJsonp['default'] : fetchJsonp;
  Papa = Papa && Papa.hasOwnProperty('default') ? Papa['default'] : Papa;
  XLSX = XLSX && XLSX.hasOwnProperty('default') ? XLSX['default'] : XLSX;

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var objectWithoutProperties = function (obj, keys) {
    var target = {};

    for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
      target[i] = obj[i];
    }

    return target;
  };

  var fetch = fetchJsonp;

  function getPoint(name, callback) {
      var ak = "49tGfOjwBKkG9zG76wgcpIbce4VZdbv6";
      var address = encodeURIComponent(name);
      // 不支持跨域，需要使用JSONP
      var geoCodingUrl = "http://api.map.baidu.com/geocoder/v2/?address=" + address + "&output=json&ak=" + ak + "&callback=?";

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
      }).then(function (res) {
          if (res.ok) {
              return res.json();
          } else {
              throw new Error('response not ok');
          }
      }).then(function (res) {
          if (res && res.status == 0 && res.result) {
              var ret = res.result;
              ret['name'] = name;
              callback && callback(ret);
          } else {
              console.log(res);
              throw new Error(res);
          }
          return res;
      }).catch(function (error) {
          console.log("failed", error);
          // console.log(name, "failed", error);
          callback && callback(null);
          // throw (error);
      });
  }

  function batchGeoCoding(list, callback) {
      var poiList = [];
      poiList.length = list.length;
      var cnts = 0;
      var cnte = 0;
      list.map(function (item, index) {
          cnts++;
          var name = item.name,
              rest = objectWithoutProperties(item, ["name"]);

          getPoint(name, function (poiInfo) {
              cnte++;
              if (poiInfo) {
                  poiInfo.params = rest;
                  poiList[index] = poiInfo;
              }
              if (cnte == cnts) {
                  callback && callback(poiList);
              }
          });
      });
  }

  var DataSetManager = function () {
      function DataSetManager(options) {
          classCallCheck(this, DataSetManager);

          this.options = options || {};
          this.data = {};
      }

      createClass(DataSetManager, [{
          key: 'importCSV',
          value: function importCSV(csvString) {
              var csv = Papa.parse(csvString, {
                  skipEmptyLines: true,
                  header: true
              });
              this.data = csv;
              return this;
          }
      }, {
          key: 'importXLSX',
          value: function importXLSX(binary) {
              var workbook = XLSX.read(binary, {
                  type: 'binary'
              });
              var csv = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
              this.importCSV(csv);
              return this;
          }
      }, {
          key: 'geoPoint',
          value: function geoPoint(lngColumnName, latColumnName) {
              var data = this.data.data;
              for (var i = 0; i < data.length; i++) {
                  data[i].geometry = {
                      type: 'Point',
                      coordinates: [data[i][lngColumnName], data[i][latColumnName]]
                  };
              }
              return this;
          }
      }, {
          key: 'geoPointWithCount',
          value: function geoPointWithCount(lngColumnName, latColumnName, countColumnName) {
              var data = this.data.data;
              for (var i = 0; i < data.length; i++) {
                  data[i].geometry = {
                      type: 'Point',
                      coordinates: [data[i][lngColumnName], data[i][latColumnName]]
                  };
                  data[i].count = parseFloat(data[i][countColumnName]) || 1;
              }
              return this;
          }
      }, {
          key: 'geoAddress',
          value: function geoAddress(columnName, callback) {
              var data = this.data.data;
              console.log('geoAddress');
              batchGeoCoding(data.map(function (item) {
                  return {
                      name: item[columnName]
                  };
              }), function (rs) {
                  for (var i = 0; i < data.length; i++) {
                      data[i].geocoding = rs[i];
                      if (data[i].geocoding && data[i].geocoding.location) {
                          var location = data[i].geocoding.location;
                          data[i].geometry = {
                              type: 'Point',
                              coordinates: [location.lng, location.lat]
                          };
                      }
                  }
                  callback && callback(data);
              });
          }
      }, {
          key: 'geoAddressWithCount',
          value: function geoAddressWithCount(addrColumnName, countColumnName, callback) {
              var data = this.data.data;
              console.log('geoAddress');
              batchGeoCoding(data.map(function (item) {
                  return {
                      name: item[addrColumnName],
                      count: item[countColumnName]
                  };
              }), function (rs) {
                  for (var i = 0; i < data.length; i++) {
                      data[i].geocoding = rs[i];
                      if (data[i].geocoding && data[i].geocoding.location && data[i].geocoding.params) {
                          var _data$i$geocoding = data[i].geocoding,
                              location = _data$i$geocoding.location,
                              params = _data$i$geocoding.params;

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

      }, {
          key: 'copyColumn',
          value: function copyColumn(fromColumn, toColumn) {
              if (this.data.data) {
                  this.data.data.forEach(function (item) {
                      item[toColumn] = item[fromColumn];
                  });
              }
              return this;
          }

          /**
           * 返回所有数据集对象
           * @return {array} 数据集数组
           */

      }, {
          key: 'getData',
          value: function getData() {
              return this.data.data;
          }

          /**
           * @return {array} 返回带地理位置的数据
           */

      }, {
          key: 'getGeoData',
          value: function getGeoData() {
              return this.data.data.filter(function (item) {
                  if (item.geometry) {
                      return true;
                  }
              });
          }
      }, {
          key: 'getFields',
          value: function getFields() {
              return this.data.meta.fields;
          }
      }]);
      return DataSetManager;
  }();

  return DataSetManager;

})));
