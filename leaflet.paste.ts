namespace L { 
    export type LeafletPasteCreated = { layer: L.Layer };
    export type LeafletPasteCreatedFn = (event: LeafletPasteCreated) => void

    export interface Evented {
        fire(event: "paste:layer-created", data: L.LeafletPasteCreated, context?: any)
        on(event: "paste:layer-created", data: L.LeafletPasteCreatedFn, context?: any)
        once(event: "paste:layer-created", data: L.LeafletPasteCreatedFn, context?: any)
        off(event: "paste:layer-created", data: L.LeafletPasteCreatedFn, context?: any)
    }

    export class Paste extends L.Handler {
        private _map: L.Map;

        initialize (map: L.Map, options: L.MapOptions) {
            this._map = map;
        }

        addHooks() {
            if (this._map) {
                L.DomEvent.on(this._map.getContainer(), 'paste', this.onclipboard, this);
            }
        }

        removeHooks() {
            if (this._map) {
                L.DomEvent.off(this._map.getContainer(), 'paste', this.onclipboard, this);
            }
        }

        toggle() {
            if (this.enabled()) {
                this.disable();
            }
            else {
                this.enable();
            }
        }

        onclipboard(e: ClipboardEvent) {
            if (e.clipboardData.items && e.clipboardData.items.length > 0) {
                for (let i = 0; i < e.clipboardData.items.length; i++){
                    try {
                        let type = e.clipboardData.items[i].type;
                        if (type === 'text/plain') {
                            let text = e.clipboardData.getData(type);
                            this.convertPastedTextToLayer(text);
                        }
                        else {
                            console.warn(`pasting objects of type ${type} is not supported`);
                        }
                    } catch (err) {
                        console.error(err.message);
                    }
                }
            }
        }
        getAndSubmitLink (text: string) {
            if (text.indexOf(Gis.Site.BackendAddress()) > -1 || text.indexOf(Gis.Site.Address()) > -1) {
                window.location.href = text;
            }
        }

        convertPastedTextToLayer (text: string) {
            let centerLatLng;
            try {
                const isValidObject = Gis.Clipboard.canBeConvertedToLayer(text);
                if (isValidObject && text.indexOf('{') > -1 && text.indexOf('geometry') > -1) {
                    let geoJson = JSON.parse(text.match(new RegExp(/.*?[{[].*[}\]].*?/))[0]);
                    if (geoJson) {
                        if (geoJson && geoJson.length) {
                            for (let i = 0; i < geoJson.length; i++) {
                                createEditableFromGeoJSON(geoJson[i]);
                            }
                            this._map.fire('gis:notify', { message: `Вставлено объектов: ${geoJson.length}` })
                        } else if (geoJson) {
                            createEditableFromGeoJSON(geoJson);
                            this._map.fire('gis:notify', { message: 'Вставлен новый объект' })
                        }
                    }
                } else {
                    const layers = Gis.Clipboard.gisTaskToLayer(text);
                    if (layers.length > 0) {
                        let i = 0;
                        for (; i < layers.length; i++) {
                            createEditableFromGeoJSON(layers[i].toStyledGeoJSON());  
                        }
                        centerLatLng = layers[0]._latlng ||
                            (layers[0]._latlngs && layers[0]._latlngs[0][0]) ||
                            (layers[0]._latlngs && layers[0]._latlngs[0]);
                        this._map.fire('gis:notify', { message: `Добавлено объектов: ${i}` })
                    }
                }
                if(centerLatLng) this._map.panTo(centerLatLng);
            } catch (e) {
                console.error(e);
            }
        }

        submit(e) {
            var value = e.target[0].value,
                type = e.target[1].value;

            try {
                this._process(value, type);
                this.disable();
            }
            catch (e) {
                var err = e;

                // Leaflet's fire() seems to clobber Error objects.
                if (e instanceof Error) {
                    err = { message: e.message };
                }
                this.fire('error', err);
            }
        }

        _process(value, type) {
            var layer;

            if (!value) {
                throw new Error('You must add a valid geometry.');
            }

            if (!L.Paste.hasOwnProperty(type)) {
                throw new Error('Unknown data type: %s.', type);
            }

            layer = L.Paste[type].call(this, value);
            const center = layer.getBounds().getCenter();

            layer.addTo(this._map);
            this._map.fire('paste:layer-created', { layer: layer });
            this._map.panTo(center);
        }
    }

    export function pasteHandler (opts) {
        return new L.Paste(opts);
    }
}

L.Map.addInitHook('addHandler', 'pasteHandler', L.pasteHandler)