function formatLineStringCoordinates (geostring) {
    let coordinates = [];
    if (typeof geostring == 'string') {
        // 去除空格
        geostring = geostring.replace(/\s+/g,'');
        let list = geostring.split(/,|;/);
        for (let i = 0; i < list.length; i+=2) {
            coordinates.push([+list[i], +list[i + 1]]);
        }
    } else {
        console.error('LineString geostring type error.')
    }
    return coordinates;
}

function formatMultiLineStringCoordinates (geostring) {
    let coordinates = [];
    if (typeof geostring == 'string') {
        // 去除空格
        geostring = geostring.replace(/\s+/g,'');
        // support multi linestring when there is seprated line in one geostring
        // multi linestring was concated with '|' 
        // like '113.22,44.33,112.22,44.22,112.22,44.22|112.22,44.22 ...'
        let lines = geostring.split('|');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const coord = formatLineStringCoordinates(line);
            coordinates.push(coord);
        }
    } else {
        console.error('MultiLineString geostring type error.')
    }
    return coordinates;
}

function formatPolygonCoordinates (geostring) {
    let coordinates = [];
    if (typeof geostring == 'string') {
        // 去除空格
        geostring = geostring.replace(/\s+/g,'');
        // support multi polygon when there is seprated land in one geostring
        // multi polygon was concated with '|' 
        // like '113.22,44.33,112.22,44.22,112.22,44.22|112.22,44.22 ...'
        let borders = geostring.split('|');
        for (let i = 0; i < borders.length; i++) {
            const border = borders[i];
            const coord = formatLineStringCoordinates(border);
            coordinates.push(coord);
        }
    } else {
        console.error('Polygon geostring type error.')
    }
    return coordinates;
}

export default {
    formatLineStringCoordinates,
    formatMultiLineStringCoordinates,
    formatPolygonCoordinates
};