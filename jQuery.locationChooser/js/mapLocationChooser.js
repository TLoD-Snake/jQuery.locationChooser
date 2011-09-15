/**
	jQuery extension for geocoding and putting marker on map to get it's lat/lng
	Copyright (C) 2011 Igor Zinkovsky aka TLoD,Snake 
	
	This program is free software; you can redistribute it and/or
	modify it under the terms of the GNU General Public License
	as published by the Free Software Foundation; either version 2
	of the License, or (at your option) any later version.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.
	
	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
	
	You can contact with author via email admin@mysterria.com 
*/
//************************** MAP AND GEOCODING ********************************//
(function($){
	$.fn.mapLocationChooser = function(settings){
		settings = $.extend({
			controls:{
				enableButton:		$('#mapEnableButton'),
				cancelButton:		$('#mapCancelButton'),
				acceptButton:		$('#mapAcceptButton'),
				geocodeInput:		$('#mapGeocodeInput'),
				geocodeButton:		$('#mapGeocodeButton'),
				geolistContainer:	$('#mapGeolistContainer')
			},
			hidables: new Array(),
			
			latInput:	$('#mapLatInput'),
			lngInput:	$('#mapLngInput'),
			zoomInput:  $('#mapZoomInput'),
			
			startLat: 59.939039,
			startLng: 30.315785,
			startZoom: 8,
			
			markers: new Array(),
			
			onEnable: function(){},
			onGeocodeResultsGained: function(){}
			
		}, settings||{});
		var canvasElementRaw = $(this).get(0);
		
		/* More simple way to manage controls */
		var controls = settings.controls;
		controls.enabled = new Array(controls.cancelButton, controls.acceptButton, controls.geocodeInput, controls.geocodeButton, controls.geolistContainer);
		$.each(settings.hidables, function(k,v){controls.enabled.push(v)});
		controls.disabled = new Array(controls.enableButton);
		
		
		/* Map init */
		
		var mapAdapter = new GoogleMapAdapter();
		var map = mapAdapter.initMap(
			canvasElementRaw, 
			{
				center: new mapAdapter.Point(settings.startLat, settings.startLng),
				zoom: settings.startZoom,
			}
		);
		if( settings.markers.length > 0 ){
			for(var i=0; i < settings.markers.length; i++){
				map.addMarker(settings.markers[i]);
			}
		}
							
		controls.enableButton // Enabling!
		.click(function(event){
			$.each(controls.disabled, function(n,c){
				c.hide();
			});	
			$.each(controls.enabled, function(n,c){
				c.show();
			});
			map.setUserInteract(true);
			map.setMarkable(true, { multiply:false, setCenter: false, confirmMode: true });
			
			settings.onEnable(event);
			return false;
		});
		
		controls.cancelButton // Disabling!
		.click(function(event){
			disableChooser();
			/*
			 * Вернуть карту в стабильное состояние
			 */
			map.useDefaults();
			map.setUserInteract(false);
			map.confirmMarkers(false);
			return false;
		}).click();
		
		controls.acceptButton // Accept!
		.click(function(event){
			try {
				map.confirmMarkers(true);
				var markers = map.getMarkers();
				if (markers[0]) {
					markers[0].setCenter();
					map.setDefaults();
					var point = markers[0].getPoint();
					settings.latInput.val(point.getLat());
					settings.lngInput.val(point.getLng());
					settings.zoomInput.val(map.getZoom());
				}else{
					settings.latInput.val('');
					settings.lngInput.val('');
				}
				map.setUserInteract(false);
				disableChooser();
			}catch(e){
				alert("Accept action error: "+e);
			}
			return false;
		});
		
		controls.geocodeButton.click(function(event){
			cleanGeocodeResults();
			
			if(! controls.geocodeInput) return false;
			if( controls.geocodeInput.val() == '' ){
				return false;
			}
						
			var geocoder = new mapAdapter.Geocoder();
			geocoder.geocode({
				address: controls.geocodeInput.val(),
				callback: function(options){
					if (options.status) {
						populateGeocodeResults(options.results);
					}else{
						alert("Не удалось определить местонахождение: " + options.statusReason);
					}
				}
			});	
		});
		
		controls.geocodeInput.keypress(function(event){
			if (event.keyCode == 13) { //Enter
				controls.geocodeButton.click();
				return false;
			}
		});
		
		function cleanGeocodeResults(){
			controls.geolistContainer.children().remove();
		}
		
		function populateGeocodeResults(results){
			$.each(results, function(k, result){
				$('<li></li>')
				.hide()
				.click(function(){
					var marker = new mapAdapter.Marker({
						map: map,
						point: result.point
					});
					marker.setCenter();
				})
				.text(result.address)
				.appendTo(controls.geolistContainer)
				.show('slow');
			});
			settings.onGeocodeResultsGained(results);
		}
		
		function disableChooser(){
			$.each(controls.disabled, function(n,c){
				c.show();
			});	
			$.each(controls.enabled, function(n,c){
				c.hide();
			});
			if(controls.geocodeInput) controls.geocodeInput.val('');
			cleanGeocodeResults();
		}
					
	}
})(jQuery);
