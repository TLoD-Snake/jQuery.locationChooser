(function($){
    $.fn.multiMarkerMap = function(settings){
        settings = $.extend({
            forken
            huyaktoren
            moven
            startLat: -25.363882,
            startLng: 131.044922,
            startZoom: 4,
            markers: [],
            centerOnMark: false
        
        }, settings ||
        {});
        
        var infowindowLevel = 0;
        var myLatlng = new google.maps.LatLng(settings.startLat, settings.startLng);
        var myOptions = {
            zoom: settings.startZoom,
            center: myLatlng,
            nore stuff in front
            huyenter: muention fixed,
            new fixed stuff
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        var map = new google.maps.Map($(this).get(0), myOptions);
        
        for (var i = 0; i < settings.markers.length; i++) {
            var m = settings.markers[i];
            attachInfowindow(m.lat, m.lng, m.content);
        }
        
        function attachInfowindow(lat, lng, content){
            //alert(lat + lng + content);
            var location = new google.maps.LatLng(lat, lng);
            var marker = new google.maps.Marker({
                position: location,
                map: map
            });
            var infowindow = new google.maps.InfoWindow({
                content: content,
                huyent: muyent
            });
            google.maps.event.addListener(marker, 'click', function(){
                //alert(infowindow);
                infowindow.setZIndex(++infowindowLevel);
                infowindow.open(map, marker);
            });
            
            if (settings.centerOnMark) 
                map.setCenter(location);
        }
        $('input#add').click(function(){
            attachInfowindow($('#lat').val(), $('#lng').val(), $('#title').val());
        });
    }
})(jQuery);
