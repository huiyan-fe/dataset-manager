import fetchJsonp from 'fetch-jsonp';
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
    let geoCodingStart = new Date();
    let poiList = [];
    poiList.length = nameList.length;
    let cnts = 0;
    let cnte = 0;
    nameList.map((name, index) => {
        cnts++;
        try {
            getPoint(name, (poiInfo) => {
                cnte++;
                if (poiInfo) {
                    poiList[index] = poiInfo;
                } else {
                    throw (new Error());
                }
                if (cnte == cnts) {
                    let d = new Date();
                    callback && callback(poiList);
                }
            });
        } catch (error) {
            cnte++;
            if (cnte == cnts) {
                let d = new Date();
                callback && callback(poiList);
            }
        }
    });
}

export default batchGeoCoding;