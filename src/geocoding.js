import fetchJsonp from 'fetch-jsonp';
let fetch = fetchJsonp;

function getPoint(name, callback) {
    let ak = "49tGfOjwBKkG9zG76wgcpIbce4VZdbv6";
    let address = encodeURIComponent(name);
    // 不支持跨域，需要使用JSONP
    let geoCodingUrl = `//api.map.baidu.com/geocoder/v2/?address=${address}&output=json&ak=${ak}`;

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

function getPoints(names, callback) {
    let ak = "49tGfOjwBKkG9zG76wgcpIbce4VZdbv6";
    let address = names.map(name => {
        return encodeURIComponent(name);
    });
    // 不支持跨域，需要使用JSONP
    let geoCodingUrls = address.map(addr => {
        return `//api.map.baidu.com/geocoder/v2/?address=${addr}&output=json&ak=${ak}`;
    });

    if (window.fetchJsonpTest) {
        fetch = window.fetchJsonpTest;
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
    
}

export {
    batchGeoCoding,
    batchGeoOdCoding,
    batchGeoBoundaryCoding
};
