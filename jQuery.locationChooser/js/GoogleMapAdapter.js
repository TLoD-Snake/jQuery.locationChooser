/**
	This is Google Maps API v3 adpater for jQuery.locationChooser
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


function GoogleMapAdapter(options){
	this.mapType = {
		ROADMAP: google.maps.MapTypeId.ROADMAP
	};
	
	/** Creating new map object */	
	this.initMap = function (canvas, options){
		/*
		 * На этом этапе мы берем унифицированный список параметров
		 * и выставляем для него разумные значения по умолчанию.
		 * Трансфер унифицированных опшенов в нативные опшены для 
		 * определенного вендора карт - дело класса Map
		 */
		options = $.extend({
			zoom: 8,
			center: new this.Point(100,100),
			mapType: this.mapType.ROADMAP
		}, options||{});
		
		/*
		 * Создаем класс-обертку Map. Этот класс будет управлять нативной картой,
		 * предоставляя нам унифицированный интерфейс
		 */
		return new this.Map(canvas, options);
	}
	
	GoogleMapAdapter.Geocoder = function(){
		this.geocoder = new google.maps.Geocoder();
		this.nativeGeocoder = function(){
			return this.geocoder; 
		}
		
        this.geocode = function(options){
			//Setting defaults
			options = $.extend({
				language: 'ru'
			}, options||{});
            
			// Geocode it
			this.nativeGeocoder().geocode({
                address: options.address,
				language: options.language
            }, resultHandler);
            
			// Handle MapEngine specific response and transform into universal format
			function resultHandler(results, status){
                if (status == google.maps.GeocoderStatus.OK) {
					var wrappedResults = new Array();
					$.each(results, function(k, result){
						var wr = {
							address:	result.formatted_address,
							point:		new GoogleMapAdapter.Point(result.geometry.location.lat(),result.geometry.location.lng()),
							nativeResult: result
						};
						wrappedResults.push(wr);
					});
					options.callback({
						results: wrappedResults,
						status: true,
						statusReason: status+"" 
					});
                } else {
					options.callback({
						status: false,
						statusReason: status+""
					});
                }
            }
        }
	}
	this.Geocoder = GoogleMapAdapter.Geocoder;
	
	
	/** Geo Point wrapper class */
	GoogleMapAdapter.Point = function (aLat, aLng){
		this.lat = aLat;
		this.lng = aLng;
		
		/** Native point representation*/
		this.nativePoint = function(){
			return new google.maps.LatLng(this.lat, this.lng);
		}
		
		this.getLat = function(){
			return this.lat;
		}
		
		this.getLng = function(){
			return this.lng;
		}
	}
	this.Point = GoogleMapAdapter.Point;
	
	/** Marker wrapper class */
	GoogleMapAdapter.Marker = function(options){
		var markerWrapper = this;
		this.map = options.map;
		this.point = options.point;
		this.info = options.info;
		this.confirmed = options.confirmed?true:false;
		this.eventListeners = {};
		
		//********** Construction  ************//
		
		/*
			 * Если разрешено ставить только один маркер, убиваем предыдущие
			 * Если активирован режим конфирмации маркинга, старые маркеры будут 
			 * сохранены в бэкапе.
		*/
		if(!this.map.markingOptions.multiply){
			try {
				this.map.dropMarkers(this.map.markingOptions.confirmMode);
			}catch(e){
				alert("Error while dropping markers: "+e);
			}
		}
				
		this.marker =  new google.maps.Marker({
			position: this.point.nativePoint(), 
			map: this.map.nativeMap()
		}); 
		this.nativeMarker = function(){
			return this.marker;
		}
		
		// Добавили в коллекцию
		this.map.markers.push(this);
		
		/* Click event handling */
		this.eventListeners.click = google.maps.event.addListener(this.nativeMarker(), 'click', function(event) {
			if( markerWrapper.map.isMarkable() )
				markerWrapper.remove(markerWrapper.map.markingOptions.confirmMode);
		});
		
		
		//**************************************//
				
		this.remove = function( confirmMode ){
			/* Убрали с карты */
			this.nativeMarker().setMap(null);
			/*
			 * Маркер фильтруется из текущего списка маркеров
			 * в любом случае
			 */
			this.map.markers = $.grep(
				this.map.markers, 
				function(anotherMarker){
					return markerWrapper.nativeMarker() == anotherMarker.nativeMarker();
				},
				true
			);
			//alert(this.map.markers.length);
			/*
			 * Все принятые, но удяляемые элементы идут в бэкап
			 * при включенном режиме конфирма 
			 */
			if( confirmMode && this.isConfirmed() ){
				this.map.markersBackup.push(this);
			}
		}
				
		this.getPoint = function(){
			return this.point;
		}
		
		this.setCenter = function(){
			//alert("Setting center");
			//var oldp = this.map.nativeMap().getCenter();
			this.map.nativeMap().setCenter( this.point.nativePoint() );
			//var newp = this.map.nativeMap().getCenter();
			//alert(oldp+"::"+this.point.nativePoint()+"::"+newp);
		}
		
		this.confirm = function(){
			this.confirmed = true;
		}
		this.isConfirmed = function(){
			return this.confirmed;
		}
		
		this.setMap = function(){
			this.nativeMarker().setMap(this.map.nativeMap());
		}
	}
	this.Marker = GoogleMapAdapter.Marker;
	
	/** Map object wrapper class */
	this.Map = function (canvas, options){
		var mapWrapper = this;
		this.defaultOptions = {
			zoom: options.zoom,
			center: options.center.nativePoint(),
			mapTypeId: options.mapType
		};
		this.markable = false;
		this.markers = new Array();
		this.markersBackup = new Array();
		this.markListener = null;
		this.markingOptions = {};
		
		this.map = new google.maps.Map(canvas, this.defaultOptions);  
		
		this.nativeMap = function(){
			return this.map;
		}
		
		/*
		 * Метод для восстановления дефолтных параметров карты.
		 * Дефолтными считаются те параметры, с которыми карта была создана,
		 * либо переаметры, установленные методом setDefaults
		 */
		this.useDefaults = function(){
			this.map.setCenter(this.defaultOptions.center);
			this.map.setZoom(this.defaultOptions.zoom);
			this.map.setMapTypeId(this.defaultOptions.mapTypeId);
		}
		/*
		 * Метод выставляет текущий зум, тип и текущее положение
		 * вьюпорта, как дефолтные.
		 */
		this.setDefaults = function(){
			this.defaultOptions = {
				center: this.map.getCenter(),
				zoom: this.map.getZoom(),
				mapTypeId: this.map.getMapTypeId()
			};
		}
		
		/*
		 * Метод разрешает или запрещает взаимодействие пользователя с картой
		 */
		this.setUserInteract = function(interact){
			this.map.setOptions({
				disableDefaultUI: interact,
				draggable: interact,
				scrollwheel: interact,
				keyboardShortcuts: interact,
				navigationControl: interact
			});
			if(!interact) this.setMarkable(interact);
		}
		
		/*
		 * Метод для определения резрешена ли работа с маркерами на карте
		 */
		this.isMarkable = function(){
			return this.markable;
		}
		
		/*
		 * Метод разрешает или запрещает установку маркеров на карте
		 * и выставляет параметры маркинга
		 */
		this.setMarkable = function(markable, options){
			this.markable = markable;
			this.markingOptions = $.extend({
				confirmMode: false
			}, options||{});
			
			if (markable && !this.markListener) {
				this.markListener = google.maps.event.addListener(this.map, 'click', this.markFired);
			}else if(!markable && this.markListener){
				google.maps.event.removeListener(this.markListener);
				this.markListener = null;
			}
			
			this.markFired = function(event){
				mapWrapper.placeMarker(event.latLng);
			}
		}
		
		/*
		 * Внутренний метод, вызываемый при установке маркера.
		 */
		this.placeMarker = function( latLng ){
			/*
			 * Здесь можно поместить колбэк для заполнения пользователем
			 * атрибутов маркера
			 * 
			 */
									
						
			// Создаем обертку маркера
			var marker = new GoogleMapAdapter.Marker({
				point: new GoogleMapAdapter.Point( latLng.lat(), latLng.lng() ), 
				map: this
			});
			
			// В центр карты
			if( this.markingOptions.setCenter ) this.map.setCenter( marker.getPoint().nativePoint() );
		}
		
		/*
		 * Внешний метод добавления маркера
		 * Добавленные этим способом маркеры автоматически становятся подтвержденными
		 */
		this.addMarker = function( markerData ){
			// Создаем обертку маркера
			var marker = new GoogleMapAdapter.Marker({
				point: new GoogleMapAdapter.Point( markerData.lat, markerData.lng ), 
				map: this,
				confirmed: true
			});
		}
		
		/*
		 * Метод, возвращающий список установленных маркеров
		 */
		this.getMarkers = function(){
			return this.markers;
		}
		
		/*
		 * Если включен режим подтверждения маркировки, то данный метод совершит либо
		 * подтверждение текущих маркеров при истинном значении параметра, либо
		 * вернет на карту прошлые значения в обратном случае.
		 */
		this.confirmMarkers = function(confirm){
			if(confirm){
				this.markersBackup = new Array();
				$.each(this.markers, function(k,marker){
					marker.confirm();
				});
			}else{
				this.markers = $.grep(
					this.markers,
					function(marker){
						if( marker.isConfirmed() ){
							return true;
						}else{
							marker.remove(false);
							return false;
						}
					}
				);
				for(var i = 0; i < this.markersBackup.length; i++ ){
					this.markersBackup[i].setMap();
					this.markers.push(this.markersBackup[i]);
				}				
				this.markersBackup = new Array();
			}
		}
		
		/*
		 * Метод убирает все маркеры с карты
		 */
		this.dropMarkers = function( confirmMode ){
			$.each(this.markers, function(k,marker){
				marker.remove(confirmMode);
			})
			//alert("markers in map:"+this.markers.length);
		}
		
		this.getZoom = function(){
			return this.map.getZoom();
		}
	}
}
