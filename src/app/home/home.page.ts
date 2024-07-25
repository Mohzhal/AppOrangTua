import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private map: L.Map | null = null;
  private routingControl: L.Routing.Control | null = null;

  currentLocation = { lat: 0, lng: 0 };
  private parentPosition: L.LatLngTuple = [0, 0];
  private childPosition: L.LatLngTuple = [0, 0];

  constructor() {}

  ngOnInit() {
    this.initMap();
    this.updateLocation();
    this.getChildLocation();
  }

  private initMap(): void {
    this.map = L.map('map').setView(this.parentPosition, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    if (this.map) {
      this.routingControl = L.Routing.control({
        waypoints: [
          L.latLng(this.parentPosition),
          L.latLng(this.childPosition),
        ],
        routeWhileDragging: true,
      }).addTo(this.map);
    }
  }

  private updateLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          this.currentLocation.lat = position.coords.latitude;
          this.currentLocation.lng = position.coords.longitude;

          this.parentPosition = [
            this.currentLocation.lat,
            this.currentLocation.lng,
          ];

          if (this.map) {
            // Add marker for parent location
            this.addMarker(this.currentLocation.lat, this.currentLocation.lng, 'Parent Location');

            this.map.setView(
              [this.currentLocation.lat, this.currentLocation.lng],
              13
            );

            if (this.routingControl) {
              this.routingControl.setWaypoints([
                L.latLng(this.parentPosition),
                L.latLng(this.childPosition),
              ]);
            }

            // Calculate and display the distance
            this.calculateDistance();
          }

          // Send location data to API
          this.sendLocation();
        },
        (error) => {
          console.error('Error getting location', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  sendLocation(): void {
    fetch('https://7543a7de-4ce1-43a6-b64e-9bcbe29a7c37-00-2p357v69b9bhz.worf.replit.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: this.currentLocation.lat,
        longitude: this.currentLocation.lng,
        user: 'parent',
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log('Success:', data))
      .catch((error) => console.error('Error:', error));
  }

  private getChildLocation(): void {
    fetch('https://7543a7de-4ce1-43a6-b64e-9bcbe29a7c37-00-2p357v69b9bhz.worf.replit.dev/')
      .then((response) => response.json())
      .then((data) => {
        this.childPosition = [data.latitude, data.longitude];

        if (this.routingControl) {
          this.routingControl.setWaypoints([
            L.latLng(this.parentPosition),
            L.latLng(this.childPosition),
          ]);
        }

        // Add marker for child location
        this.addMarker(this.childPosition[0], this.childPosition[1], 'Child Location');
      })
      .catch((error) => console.error('Error:', error));
  }

  private addMarker(lat: number, lng: number, label: string): void {
    const marker = L.marker([lat, lng]).addTo(this.map!).bindPopup(label);
    this.getAddress(lat, lng).then(address => {
      marker.setPopupContent(`${label}<br>${address}`);
      marker.openPopup();
    });
  }

  private getAddress(lat: number, lng: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    return fetch(url)
      .then(response => response.json())
      .then(data => data.display_name)
      .catch(error => {
        console.error('Error fetching address:', error);
        return 'Address not found';
      });
  }

  private calculateDistance(): void {
    const latLng1 = L.latLng(this.parentPosition);
    const latLng2 = L.latLng(this.childPosition);
    const distance = latLng1.distanceTo(latLng2) / 1000; // Convert to kilometers
    console.log(`Distance: ${distance.toFixed(2)} km`);
  }
}
