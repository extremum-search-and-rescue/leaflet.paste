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
                L.DomEvent.on(this._map.getContainer(), 'paste', this.onclipboard, this);
            }
        }
        removeHooks() {
            if (this._map) {
                L.DomEvent.off(this._map.getContainer(), 'paste', this.onclipboard, this);
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
                            centerLatLng = firstLayer.getBounds && firstLayer.getBounds()[0][0] ||
                                firstLayer.getBounds && firstLayer.getBounds()[0];
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
        submit(e) {
            var value = e.target[0].value, type = e.target[1].value;
            try {
                this._process(value, type);
                this.disable();
            }
            catch (e) {
                var err = e;
                if (e instanceof Error) {
                    err = { message: e.message };
                }
                this._map.fire('paste:error', err);
            }
        }
        _process(value, type) {
            var layer;
            if (!value) {
                throw new Error('You must add a valid geometry.');
            }
            if (!L.Paste.hasOwnProperty(type)) {
                throw new Error(`Unknown data type: ${type}`);
            }
            layer = L.Paste[type].call(this, value);
            const center = layer.getBounds().getCenter();
            layer.addTo(this._map);
            this._map.fire('paste:layer-created', { layer: layer });
            this._map.panTo(center);
        }
    }
    L.Paste = Paste;
    function pasteHandler(map) {
        return new L.Paste(map);
    }
    L.pasteHandler = pasteHandler;
})(L || (L = {}));
L.Map.addInitHook('addHandler', 'pasteHandler', L.pasteHandler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhZmxldC5wYXN0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxlYWZsZXQucGFzdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBVSxDQUFDLENBOElWO0FBOUlELFdBQVUsQ0FBQztJQWdCUCxNQUFhLEtBQU0sU0FBUSxDQUFDLENBQUMsT0FBTztRQUFwQzs7WUFFWSxtQkFBYyxHQUFXLG1CQUFtQixDQUFBO1FBdUh4RCxDQUFDO1FBdEhHLFVBQVUsQ0FBRSxHQUFVO1lBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUM7UUFFUSxRQUFRO1lBQ2IsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNYLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDNUU7UUFDTCxDQUFDO1FBRVEsV0FBVztZQUNoQixJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1gsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM3RTtRQUNMLENBQUM7UUFFRCxXQUFXLENBQUMsQ0FBaUI7WUFDekIsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUMzRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFDO29CQUNsRCxJQUFJO3dCQUNBLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzt3QkFDekMsSUFBSSxJQUFJLEtBQUssWUFBWSxFQUFFOzRCQUN2QixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDekMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUN2Qzs2QkFDSTs0QkFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixJQUFJLG1CQUFtQixDQUFDLENBQUM7eUJBQ3BFO3FCQUNKO29CQUFDLE9BQU8sR0FBRyxFQUFFO3dCQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3FCQUM5QjtpQkFDSjthQUNKO1FBQ0wsQ0FBQztRQUNELGdCQUFnQixDQUFFLElBQVk7WUFDMUIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDdkYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO2FBQy9CO1FBQ0wsQ0FBQztRQUVELHdCQUF3QixDQUFFLElBQVk7WUFDbEMsSUFBSSxZQUFzQixDQUFDO1lBQzNCLElBQUk7Z0JBQ0EsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxhQUFhLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO29CQUMxRSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdELElBQUksT0FBTyxFQUFFO3dCQUNULElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTs0QkFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0NBQ3JDLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzZCQUN6Qzs0QkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7eUJBQ3JGOzZCQUFNOzRCQUNILHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxDQUFDOzRCQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO3lCQUNyRTtxQkFDSjtpQkFDSjtxQkFBTTtvQkFDSCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNWLE9BQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQzNCLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQzdEO3dCQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0IsSUFBSSxVQUFVLFlBQVksQ0FBQyxDQUFDLGlCQUFpQixJQUFJLFVBQVUsWUFBWSxDQUFDLENBQUMsaUJBQWlCOzRCQUN0RixZQUFZLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDOzZCQUNyQzs0QkFDRCxZQUFZLEdBQUcsVUFBVSxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUMvRCxVQUFVLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTt5QkFDeEQ7d0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7cUJBQ3hFO2lCQUNKO2dCQUNELElBQUcsWUFBWTtvQkFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUNsRDtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEI7UUFDTCxDQUFDO1FBRUQsTUFBTSxDQUFDLENBQUM7WUFDSixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFDekIsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRTdCLElBQUk7Z0JBQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUNsQjtZQUNELE9BQU8sQ0FBQyxFQUFFO2dCQUNOLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFHWixJQUFJLENBQUMsWUFBWSxLQUFLLEVBQUU7b0JBQ3BCLEdBQUcsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ2hDO2dCQUNELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUN0QztRQUNMLENBQUM7UUFFRCxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUk7WUFDaEIsSUFBSSxLQUFLLENBQUM7WUFFVixJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUNSLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQzthQUNyRDtZQUVELElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxFQUFFLENBQUMsQ0FBQzthQUNqRDtZQUVELEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBRTdDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQztLQUNKO0lBekhZLE9BQUssUUF5SGpCLENBQUE7SUFFRCxTQUFnQixZQUFZLENBQUUsR0FBVTtRQUNwQyxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRmUsY0FBWSxlQUUzQixDQUFBO0FBQ0wsQ0FBQyxFQTlJUyxDQUFDLEtBQUQsQ0FBQyxRQThJVjtBQUVELENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFBIn0=