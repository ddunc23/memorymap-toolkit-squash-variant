// Filter features by theme

$('.theme').click(function(e) {
    e.preventDefault();
    let key = $(this).data('key');
    if (key != undefined) {
        
        map.setFilter('polygons', ['==', ['get', 'theme_id'], key]);
        map.setFilter('polygon_outlines', ['==', ['get', 'theme_id'], key]);
        map.setFilter('points', ['==', ['get', 'theme_id'], key]);
        map.setFilter('points_labels', ['==', ['get', 'theme_id'], key]);
        map.setFilter('polygon_labels', ['==', ['get', 'theme_id'], key]);

        $('.theme').each(function() {
            var color = $(this).data('color');
            $(this).css('background-color', 'transparent');
            $(this).css('color', color);
        });

        let color = $(this).data('color');
        $(this).css('background-color', color);
        $(this).css('color', '#e3e3e3');

    } else {
        map.setFilter('polygons');
        map.setFilter('polygon_outlines');
        map.setFilter('points');
        map.setFilter('points_labels');
        map.setFilter('polygon_labels');
        $('.theme').each(function() {
            let color = $(this).data('color');
            $(this).css('background-color', 'transparent');
            $(this).css('color', color);
        });
    }
});


class TagControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl shadow d-none d-sm-block';    
        this._container.id = 'map_tags';
        this._container.innerHTML = MmtMap.tagFilter.generateTagControlHtml();
        return this._container;
    }
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}


// Filter features by tag

MmtMap.tagFilter = {
    tagControlHmtlTemplate: '<div><strong>Tags</strong> <span class="tag_list"></span><div class="tag_box d-none"><%= tags %><br /><a href="#" class="clear_filters">Clear Tags</a></div>',
    tagLinkHtmlTemplate: '<a href class="tag" href="#" data-tag="<%= tag %>"><%= tag %></a> ',

    generateTagControlHtml: function() {
        let tagControlHtml = _.template(MmtMap.tagFilter.tagControlHmtlTemplate);
        let tag_links = '';
        for (let i=0; i<MmtMap.tags.length; i++) {
            let tagLinkHtml = _.template(MmtMap.tagFilter.tagLinkHtmlTemplate);
            tagLinkHtml = tagLinkHtml({
                tag: MmtMap.tags[i]
            });
            tag_links += tagLinkHtml;
        }
        tagControlHtml = tagControlHtml({
            tags: tag_links
        });
        return tagControlHtml;
    },

    clearFilters: function() {
        // Set visibility to true if the layer has been hidden
        map.setLayoutProperty('polygons', 'visibility', 'visible');
        map.setLayoutProperty('polygon_outlines', 'visibility', 'visible');
        map.setLayoutProperty('points', 'visibility', 'visible');
        map.setLayoutProperty('lines', 'visibility', 'visible');

        // Clear all filters
        map.setFilter('polygons');
        map.setFilter('polygon_outlines');
        map.setFilter('points');
        map.setFilter('polygon_labels');
        map.setFilter('points_labels');
        map.setFilter('lines');
    },

    onlyUnique: function(value, index, self) { 
        return self.indexOf(value) === index;
    },

    filterFeaturesByTag: function(tags) {
        // Remove any popups
        MmtMap.clickInteractions.clickPopup.remove()
        MmtMap.hoverInteractions.smallPopup.remove()
        MmtMap.tagFilter.clearFilters();

        filtered_geojson = {
            "type": "FeatureCollection",
            "features": []
        }

        let polygon_features = [];
        let polygon_ids = [];

        let point_features = [];
        let point_ids = [];

        let line_features = [];
        let line_ids = [];

        for (let i=0; i<MmtMap.length; i++) {

            let filtered_polygons_geojson = polygons_geojson.features.filter(function(feature) { 
                let feature_tags = feature.properties.tags; 
                return feature_tags.indexOf(tags[i]) > -1; 
            });

            polygon_features = polygon_features.concat(filtered_polygons_geojson);

            let filtered_points_geojson = points_geojson.features.filter(function(feature) { 
                let feature_tags = feature.properties.tags; 
                return feature_tags.indexOf(tags[i]) > -1; 
            });

            point_features = point_features.concat(filtered_points_geojson);

            let filtered_lines_geojson = lines_geojson.features.filter(function(feature) { 
                let feature_tags = feature.properties.tags; 
                return feature_tags.indexOf(tags[i]) > -1; 
            });

            line_features = line_features.concat(filtered_lines_geojson);

        };
        
        for (let i=0; i<polygon_features.length; i++) {
            polygon_ids.push(polygon_features[i].id);
        }

        for (let i=0; i<point_features.length; i++) {
            point_ids.push(point_features[i].id);
        }

        for (let i=0; i<line_features.length; i++) {
            line_ids.push(line_features[i].id);
        }

        polygon_ids = polygon_ids.filter(MmtMap.tagFilter.onlyUnique);
        point_ids = point_ids.filter(MmtMap.tagFilter.onlyUnique);
        line_ids = line_ids.filter(MmtMap.tagFilter.onlyUnique);

        if (polygon_ids.length > 0) {
            map.setFilter('polygons', ['match', ['id'], polygon_ids, true, false]);
            map.setFilter('polygon_outlines', ['match', ['id'], polygon_ids, true, false]);    
        } else {
            map.setLayoutProperty('polygons', 'visibility', 'none');
            map.setLayoutProperty('polygon_outlines', 'visibility', 'none');
        }

        if (point_ids.length > 0) {
            map.setFilter('points', ['match', ['id'], point_ids, true, false]);
            map.setFilter('points_labels', ['match', ['id'], point_ids, true, false]);    
        } else {
            map.setLayoutProperty('points', 'visibility', 'none');
            map.setLayoutProperty('points_labels', 'visibility', 'none');
        }

        if (line_ids.length > 0) {
            map.setFilter('lines', ['match', ['id'], line_ids, true, false]);
            map.setFilter('lines_labels', ['match', ['id'], line_ids, true, false]);    
        } else {
            map.setLayoutProperty('lines', 'visibility', 'none');
            map.setLayoutProperty('lines_labels', 'visibility', 'none');
        }
    },

    tag_control: new TagControl(),
    tag_list: []
}

map.addControl(MmtMap.tagFilter.tag_control, 'bottom-left');


$('.tag').click(function(e) {
    e.preventDefault(e);
    $('.tag_list').append($(this).text() + ' ');
    var tag = $(this).data('tag');
    MmtMap.tagFilter.tag_list.push(tag);
    MmtMap.tagFilter.filterFeaturesByTag(MmtMap.tagFilter.tag_list);
});

$('.clear_filters').click(function(e) {
    e.preventDefault(e);
    $('.tag_list').html('');
    MmtMap.tagFilter.tag_list = [];
    MmtMap.tagFilter.clearFilters();
});

$('#map_tags').hover(
    function() {
        $('.tag_box').removeClass('d-none');
    }, function() {
        $('.tag_box').addClass('d-none');
    }
);