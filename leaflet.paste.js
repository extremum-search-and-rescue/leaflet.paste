var L;
(function (L) {
    class Paste extends L.Handler {
        constructor() {
            super(...arguments);
            this.REGEXP_GEOJSON = /.*?[{[].*[}\]].*?/;
        }
        initialize(map) {
            this._map = map;
        }
        addHooks() {
            if (this._map) {
                L.DomEvent.on(this._map.getContainer().parentElement, 'paste', this.onclipboard, this);
            }
        }
        removeHooks() {
            if (this._map) {
                L.DomEvent.off(this._map.getContainer().parentElement, 'paste', this.onclipboard, this);
            }
        }
        onclipboard(e) {
            if (e.clipboardData.items && e.clipboardData.items.length > 0) {
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                    try {
                        let type = e.clipboardData.items[i].type;
                        if (type === 'text/plain') {
                            let text = e.clipboardData.getData(type);
                            this.convertPastedTextToLayer(text);
                        }
                        else {
                            console.warn(`pasting objects of type ${type} is not supported`);
                        }
                    }
                    catch (err) {
                        console.error(err.message);
                    }
                }
            }
        }
        getAndSubmitLink(text) {
            if (text.indexOf(Gis.Site.BackendAddress()) > -1 || text.indexOf(Gis.Site.Address()) > -1) {
                window.location.href = text;
            }
        }
        convertPastedTextToLayer(text) {
            let centerLatLng;
            try {
                const isValidObject = Gis.Clipboard.canBeConvertedToLayer(text);
                if (isValidObject && text.indexOf('{') > -1 && text.indexOf('geometry') > -1) {
                    let geoJson = JSON.parse(text.match(this.REGEXP_GEOJSON)[0]);
                    if (geoJson) {
                        if (geoJson.length) {
                            for (let i = 0; i < geoJson.length; i++) {
                                createEditableFromGeoJSON(geoJson[i]);
                            }
                            this._map.fire('gis:notify', { message: `Вставлено объектов: ${geoJson.length}` });
                        }
                        else {
                            createEditableFromGeoJSON(geoJson);
                            this._map.fire('gis:notify', { message: 'Вставлен новый объект' });
                        }
                    }
                }
                else {
                    const layers = Gis.Clipboard.gisTaskToLayer(text);
                    if (layers.length > 0) {
                        let i = 0;
                        for (; i < layers.length; i++) {
                            createEditableFromGeoJSON(layers[i].feature || layers[i]);
                        }
                        const firstLayer = layers[0];
                        if (firstLayer instanceof L.EditableGisCircle || firstLayer instanceof L.EditableGisMarker)
                            centerLatLng = firstLayer.getLatLng();
                        else {
                            centerLatLng = firstLayer.getBounds && firstLayer.getBounds().getCenter();
                        }
                        this._map.fire('gis:notify', { message: `Добавлено объектов: ${i}` });
                    }
                }
                if (centerLatLng)
                    this._map.panTo(centerLatLng);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    L.Paste = Paste;
    function pasteHandler(map) {
        return new L.Paste(map);
    }
    L.pasteHandler = pasteHandler;
})(L || (L = {}));
L.Map.addInitHook('addHandler', 'pasteHandler', L.pasteHandler);
//# sourceMappingURL=leaflet.paste.js.map