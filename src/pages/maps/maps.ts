import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ViewChild, ElementRef } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
import { NativeGeocoder, NativeGeocoderReverseResult, NativeGeocoderForwardResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder';

/**
 * Generated class for the MapsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

declare var google;
let infowindow: any;
let options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

@IonicPage()
@Component({
  selector: 'page-maps',
  templateUrl: 'maps.html',
})
export class MapsPage {

  source:any;
  destination:any;
  @ViewChild('map') mapElement;
  map:any;
  latit:any;
  longit:any;
  itemToSearch:any;
  itemsList = [];

  constructor(public navCtrl: NavController, 
              private geolocation:Geolocation,
              private nativeGeocoder: NativeGeocoder,
              private launchNavigator: LaunchNavigator,
              private locationAccuracy: LocationAccuracy,
              public navParams: NavParams) {
             
                this.itemToSearch = this.navParams.get('search');
                this.latit = this.navParams.get('latit');
                this.longit = this.navParams.get('longit');

                console.log(this.itemToSearch,this.latit,this.longit);

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MapsPage');

    this.initMap();     
  }

  initMap(){

    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };

    let latLng = new google.maps.LatLng(this.latit,this.longit);
    let mapOptions = {
      center: latLng,
      zoom:17,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement,mapOptions)
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: {lat: this.latit, lng:this.longit},
      zoom: 15
    });
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(this.map);
    service.nearbySearch({
      location: {lat: this.latit, lng: this.longit},
      radius: 1000,
      type: [this.itemToSearch]
    }, (results,status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          this.createMarker(results[i]);

          this.nativeGeocoder.reverseGeocode(results[i].geometry.viewport.f.b, results[i].geometry.viewport.b.b, options)
          .then((result: NativeGeocoderReverseResult[]) =>{
            console.log(JSON.stringify(result[0]));
            console.log(result,"all results");
          })
          .catch((error: any) => console.log(error));

          this.itemsList.push({
            name:results[i].name,
            address:results[i].vicinity,
            latitude:results[i].geometry.viewport.f.b,
            longitude:results[i].geometry.viewport.b.b
          })
        }
      }
    });

  }

  createMarker(place) {

    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: this.map,
      position: placeLoc
    });
  
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(this.map, this);
    });

    // google.maps.event.addListener(marker, 'click', function() {
    //   // infowindow.setContent(place.name);
    //   // infowindow.open(map, this);
    //   infowindow.setContent('<div><strong>' + place.name + '</strong><br>' +
    //     'Place ID: ' + place.place_id + '<br>' +
    //     place.vicinity + '</div>');
    //   infowindow.open(map, this);
    // });

  }

  showRoute(item)
  {
    console.log(item,"item");

    

    let latLng1 = new google.maps.LatLng(item.latitude,item.longitude);
    let latLng2 = new google.maps.LatLng(this.latit,this.longit);

    console.log(latLng1,"latLng");
    let options: LaunchNavigatorOptions = {
      start: [this.latit,this.longit],
    };      
    this.launchNavigator.navigate([item.latitude,item.longitude], options)
    .then(
      success => console.log('Launched navigator'),
      error => console.log('Error launching navigator', error)
    );

    let opt: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };

  }
}
