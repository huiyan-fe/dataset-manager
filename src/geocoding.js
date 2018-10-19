import fetchJsonp from 'fetch-jsonp';

let ak = "49tGfOjwBKkG9zG76wgcpIbce4VZdbv6";
let batchLimit = 100;   // 批量查询限制为100个地名

function getPoint(name, callback) {
    let address = encodeURIComponent(name);
    let geoCodingUrl = `//api.map.baidu.com/geocoder/v2/?address=${address}&output=json&ak=${ak}`;

    // 不支持跨域，需要使用JSONP
    if (window.fetchJsonpTest) {
        fetch = window.fetchJsonpTest;
    } else {
        fetch = fetchJsonp;
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

function getPoints(names, callback) {
    let address = names.map(name => {
        return encodeURIComponent(name);
    });
    let geoCodingUrls = address.map(addr => {
        return `//api.map.baidu.com/geocoder/v2/?address=${addr}&output=json&ak=${ak}`;
    });

    // 不支持跨域，需要使用JSONP
    if (window.fetchJsonpTest) {
        fetch = window.fetchJsonpTest;
    } else {
        fetch = fetchJsonp;
    }

    Promise.all(geoCodingUrls.map((url, index) =>
        fetch(url, {
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
                ret['name'] = names[index];
            } else {
                console.log(res);
                throw (new Error(res));
            }
            return res.result;
        })
        .catch(error => {
            console.log("failed", error);
            // console.log(name, "failed", error);
            callback && callback(null);
            // throw (error);
        })
    )).then(res => {
        callback && callback(res);
    });
}

function getBounds(name, callback) {
    let address = encodeURIComponent(name);
    let geoCodingUrl = `//da42drxk9awgx.cfc-execute.bj.baidubce.com/map/api/getBoundary?city=${address}`;

    // 使用CORS方式来跨域
    fetch(geoCodingUrl, {

        credentials: "same-origin",
        mode: "cors",
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

function batchGeoCoding(list, callback) {
    let geoCodingStart = new Date();
    let poiList = [];
    poiList.length = list.length;
    let cnts = 0;
    let cnte = 0;
    list.map((item, index) => {
        cnts++;
        let {name, ...rest} = item;
        getPoint(name, (poiInfo) => {
            cnte++;
            if (poiInfo) {
                poiInfo.params = rest;
                poiList[index] = poiInfo;
            } else {
            }
            if (cnte == cnts) {
                callback && callback(poiList);
            }
        });
    });
}

function batchGeoOdCoding(list, callback) {
    let geoCodingStart = new Date();
    let poiList = [];
    poiList.length = list.length;
    let cnts = 0;
    let cnte = 0;
    list.map((item, index) => {
        cnts++;
        let {start, end, ...rest} = item;
        let names = [start, end];
        getPoints(names, (poiInfo) => {
            cnte++;
            if (poiInfo) {
                let newInfo = {
                    from: poiInfo[0],
                    to: poiInfo[1],
                    params: rest
                }
                poiList[index] = newInfo;
            } else {
            }
            if (cnte == cnts) {
                callback && callback(poiList);
            }
        });
    });
}

function batchGeoBoundaryCoding(list, callback) {
    let poiList = [];
    poiList.length = list.length;
    let cnts = 0;
    let cnte = 0;
    list.map((item, index) => {
        cnts++;
        let {name, ...rest} = item;
        getBounds(name, (poiInfo) => {
            cnte++;
            if (poiInfo.length) {
                poiInfo[0].params = rest;
                poiList[index] = poiInfo[0];
            } else {
            }
            if (cnte == cnts) {
                callback && callback(poiList);
            }
        });
    });
}

function batchGeoBoundaryCodingMas(list, callback) {
    let poiList = [];
    poiList.length = list.length;
    let cnts = 0;
    let cnte = 0;

    let limit = 0;
    let tmpArr = [];    // 暂存数组，长度不超过limit
    list.map((name, index) => {
        tmpArr.push(name);
        if (limit < batchLimit && limit < list.length - 1) {
            limit += 1;
        } else {
            cnts++;
            let names = tmpArr.join(',');
            getBounds(names, (poiInfo) => {
                cnte++;
                if (poiInfo.length) {
                    for (let i = 0; i < poiInfo.length; i++) {
                        poiList[i] = poiInfo[i];
                    }
                }
                if (cnte == cnts) {
                    callback && callback(poiList);
                }
            });
            // reset
            limit = 0;
            tmpArr.length = 0;
        }
    });
}

export {
    batchGeoCoding,
    batchGeoOdCoding,
    batchGeoBoundaryCoding,
    batchGeoBoundaryCodingMas
};
