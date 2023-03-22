/*
Points to remember:
1. Social Media Icons
2. Favorite Icon on separate line issue.
3. Go through piaza posts.
4. Go through grading guidelines.
5. Backend handling of incomplete data.
*/
import { Component, OnInit, ViewEncapsulation, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';

declare function formInit(): any;
declare function submitForm(location: any): any;

const API_KEY = "e8067b53"

@Component({
	selector: 'app-search-component',
	templateUrl: './search.component.html',
	styleUrls: ['./search.component.css'],
	providers: [NgbCarouselConfig],
	encapsulation: ViewEncapsulation.None
})

export class SearchComponent implements OnInit 
{
	events: any = [];
	eventDetails: any;
	venueDetails: any = [];
	isEventsDataFound = false;
	isTabsDataFound = false;
	isEventDetailsDataFound = false;
	isMusicRelated = false;
	isVenueDataFound = false;
	noEventsDataFound = false;
	noArtistsFound = false;
	artistsInfo: any = [];
	showMoreOpenHours = true;
	showMoreGeneralrule = true;
	showMoreChildRule = true;
	modalDisplay = 'none';
	showGoogleMaps = false;
	mapOptions: google.maps.MapOptions;
	marker: google.maps.Marker;
	favoriteText = "favorite_border";
	favoriteColor = "black";

	KeywordCtrl = new FormControl();
	filteredKeywords: any;
	isLoading = false;
	isLocationDisabled = false;
	errorMsg!: string;
	minLengthTerm = 1;
	selectedKeyword: any = "";
	category: any = "";
	distance: any = "";
	location: any = "";
	ipinfoUrl = "https://ipinfo.io/json?token=33135b61180fbe";
	carouselConfig: NgbCarouselConfig;

	initializeFlags()
	{
		this.isLocationDisabled = false;

		this.isEventsDataFound = false;
		this.isTabsDataFound = false;
		this.isEventDetailsDataFound = false;
		this.isMusicRelated = false;
		this.isVenueDataFound = false;
		this.noEventsDataFound = false;
		this.noArtistsFound = false;

		this.showMoreOpenHours = true;
		this.showMoreGeneralrule = true;
		this.showMoreChildRule = true;
	}

	constructor(private http: HttpClient, config: NgbCarouselConfig, private renderer2: Renderer2, @Inject(DOCUMENT) private _document: Document) 
	{
		this.carouselConfig = config
		config.interval = 0; //disables carousel autoplay.
    	config.pauseOnHover = true; //diables carousel on hover.

		if(localStorage.getItem('favorite') == null)
			localStorage.setItem('favorite', JSON.stringify(new Array()));

		this.mapOptions = {};
		this.marker = new google.maps.Marker({position: null});
		this.marker.getPosition();
	}
	
	displayWith(value: any) {return value;}
	clearSelection() {this.selectedKeyword = ""; this.filteredKeywords = [];}
	onSelected() {console.log(this.selectedKeyword);this.selectedKeyword = this.selectedKeyword;}

	openModal()
	{
		this.modalDisplay = 'block';
	}
	closeModal()
	{
		this.modalDisplay = 'none';
	}
	expand(id: any)
	{
		if(id == 'openHours')
			this.showMoreOpenHours = false;
		else if(id == 'generalRule')
			this.showMoreGeneralrule = false;
		else if(id == 'childRule')
			this.showMoreChildRule = false;

		var element = document.getElementById(id) as HTMLInputElement;
		element.style.overflow = 'visible';
		element.style.height ='auto';
	}

	collapse(id: any)
	{
		if(id == 'openHours')
			this.showMoreOpenHours = true;
		else if(id == 'generalRule')
			this.showMoreGeneralrule = true;
		else if(id == 'childRule')
			this.showMoreChildRule = true;
		var element = document.getElementById(id) as HTMLInputElement;
		element.style.overflow = 'hidden';
		element.style.height ='40px';
	}


	switchFavorite(selectedEventId: string)
	{
		const favorite = document.getElementById('favorite') as HTMLInputElement;
	
		
		if(favorite?.textContent === 'favorite_border')
		{
			alert("Event added to Favorites!");
			
			this.favoriteText = "favorite";
			this.favoriteColor = "red";
			
			var favorites = JSON.parse(localStorage.getItem("favorite") || '[]');
			favorites.push(this.eventDetails);
			localStorage.setItem('favorite', JSON.stringify(favorites) );
		}
		else
		{
			//raise alert
			alert("Removed from Favorites!");

			//make UI changes
			this.favoriteText = "favorite_border";
			this.favoriteColor = "black";

			//remove from localStorage
			var favoritesArray: any = [];
			favoritesArray = JSON.parse(localStorage.getItem('favorite') || '[]');
			
			console.log("Favorites Array: " + favoritesArray);
			for(let i=0; i<favoritesArray.length; i++)
			{
				if(favoritesArray[i]['eventId'] == selectedEventId)
				{
					favoritesArray.splice(i, 1);
					break;
				}
			}
			
			localStorage.setItem('favorite', JSON.stringify(favoritesArray));
		}
	}
	
	checkAutoDetect()
	{
		const autoDetectCheckBox = document.getElementById('autoDetectLocation') as HTMLInputElement;
		const locationObj = document.getElementById('location') as HTMLInputElement;

		
		if(autoDetectCheckBox.checked)
		{
			locationObj.textContent = "";
			this.isLocationDisabled = true;
			locationObj.required = false;
		}
		else
		{
			locationObj.textContent = "";
			this.isLocationDisabled = false;
			locationObj.required = true;
		}
	}
	clearForm()
	{
		this.initializeFlags();

		const locationObj = document.getElementById('location') as HTMLInputElement;
		locationObj.textContent = "";
		this.isLocationDisabled = false;
		locationObj.required = true;

	}

	getApiCall(url: string){return this.http.get(url);}

	disableArrows(show: boolean)
	{
		if(!show)
			this.carouselConfig.showNavigationArrows = true;
		else
			this.carouselConfig.showNavigationArrows = false;
	}
	rowClick(id: string, venueName: string)
	{	
		//reset these variables
		this.artistsInfo = [];

		var eventURL = "http://localhost:8000/eventDetails?id=" + id;
		console.log(id);
		this.getApiCall(eventURL)
		.subscribe(RES =>
			{
				console.log("Event Details" + RES);
				this.eventDetails = RES;
				let artists = JSON.parse(JSON.stringify(RES)).eventArtist;
				let artistString = '';
				for(let i=0; i < artists.length; i++)
				{
					if(i == artists.length - 1)
						artistString = artistString + artists[i].artistName;
					else
						artistString = artistString + artists[i].artistName + " | ";
				}
				
				if(this.eventDetails.ticketStatus != '')
				{
					if(this.eventDetails.ticketStatus == 'onsale')
					{
						this.eventDetails.ticketStatusColor = "green";
						this.eventDetails.ticketStatus= "On Sale";
					}
					else if(this.eventDetails.ticketStatus == 'offsale')
					{
						this.eventDetails.ticketStatusColor = "red";
						this.eventDetails.ticketStatus = "Off Sale";
					}
					else if(this.eventDetails.ticketStatus == 'postponed')
					{
						this.eventDetails.ticketStatusColor = "orange";
						this.eventDetails.ticketStatus = "Postponed";
					}
					else if(this.eventDetails.ticketStatus == 'cancelled')
					{
						this.eventDetails.ticketStatusColor = "black";
						this.eventDetails.ticketStatus = "Cancelled";
					}
					else if(this.eventDetails.ticketStatus ==  'rescheduled')
					{
						this.eventDetails.ticketStatusColor = "orange";
						this.eventDetails.ticketStatus = "Rescheduled";
					}
				}
				
				this.eventDetails['artistString'] = artistString;	
				
				const favorite = document.getElementById('favorite') as HTMLInputElement;
				var isAlreadySelected = false;
				var favorites = JSON.parse(localStorage.getItem("favorite") || '[]');
				for(let fav of favorites)
					if(fav?.eventId == this.eventDetails?.eventId)
						isAlreadySelected = true;
				
				if(isAlreadySelected)
				{
					this.favoriteText = "favorite";
					this.favoriteColor = "red";
				}
				else
				{
					this.favoriteText = "favorite_border";
					this.favoriteColor = "black";
				}
			

				//setting flags
				this.isEventsDataFound = false;
				this.isTabsDataFound = true;
				this.isEventDetailsDataFound = true;
				
				let artistCount = 0;
				for(let artist of this.eventDetails.eventArtist)
				{
					if(artist.isMusicRelated)
					{
						this.isMusicRelated = true;
						this.noArtistsFound = false;
						artistCount++;
						var artistURL = "http://localhost:8000/artistInfo?artist=" + encodeURIComponent(artist.artistName);
					
						this.getApiCall(artistURL)
						.subscribe(RES =>
							{
								console.log(RES);
								if(JSON.parse(JSON.stringify(RES)).type != 'noRecords')
									this.artistsInfo.push(JSON.parse(JSON.stringify(RES)).message);

							});
					}
				}
				if(artistCount <= 1)
				{
					this.disableArrows(true);
					if (artistCount == 0)
						this.noArtistsFound = true;
				}
				else
					this.disableArrows(false);
				
			});
		
		
		
		var venueURL = "http://localhost:8000/venueDetails?venueName=" + encodeURIComponent(venueName);
		this.getApiCall(venueURL)
		.subscribe(res =>
			{
				var name = JSON.parse(JSON.stringify(res)).venueName;
				var address = JSON.parse(JSON.stringify(res)).venueAddress;
				var city = JSON.parse(JSON.stringify(res)).venueCity;
				let latLongURL = "https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyACnXuRfgeAz9JQnggOf3EJ6L6N1pgCeag&address=";
				latLongURL += encodeURIComponent(name+", "+address+", "+city);
				fetch(latLongURL)
				.then(RES => RES.json())
				.then(DATA => {
					this.showGoogleMaps = false;
					if('results' in DATA)
						if(DATA['results'].length > 0)
							if('geometry' in DATA['results'][0])
								if('location' in DATA['results'][0]['geometry'])
								{
									var lat = 0, lng = 0;
									if('lat' in DATA['results'][0]['geometry']['location'])
									{
										lat = parseFloat(DATA['results'][0]['geometry']['location']['lat']);
										this.showGoogleMaps = true;
									}
									if('lat' in DATA['results'][0]['geometry']['location'])
									{
										lng = parseFloat(DATA['results'][0]['geometry']['location']['lng']);
										this.showGoogleMaps = true;
									}
									this.mapInitializer(lat, lng);
								}

				});

				this.venueDetails = res;
				//localStorage.setItem('venueDetails', JSON.stringify(res));
				this.isVenueDataFound = true;
			});
	}
	mapInitializer(lat: number, lng: number) {
		// the coordinates are created with the correct lat and lng. Not with 0, 0
		const coordinates = new google.maps.LatLng(lat, lng);
	
		this.mapOptions = {
		  center: coordinates,
		  zoom: 15
		};
	
		this.marker = new google.maps.Marker({
		  position: coordinates
		});
	
	  }
	onSubmit() 
	{
		this.isTabsDataFound = false;
		this.isEventDetailsDataFound = false;
		this.isVenueDataFound = false;

		const location = document.getElementById('location') as HTMLInputElement;
		const distance = document.getElementById('distance') as HTMLInputElement | null;
		const category = document.getElementById('category') as HTMLInputElement | null;
		
		var loc = submitForm(location?.value);

		var url = "http://localhost:8000/search?";
		url += 'keyword=' + encodeURIComponent(this.selectedKeyword);
		url += '&distance=' + distance?.value;
		url += '&category=' + category?.value;
		url += '&location=' + encodeURIComponent(loc);

		//fetch events data
		this.getApiCall(url)
		.subscribe(res =>
			{
				console.log(res);
				
				if('result' in res)
				{
					this.events = res.result;
					//localStorage.setItem('allEvents', JSON.stringify(res));
				}
				if(this.events.length > 0)
				{
					this.isEventsDataFound = true;
					this.noEventsDataFound = false;
				}
				else
				{
					this.noEventsDataFound = true;
					this.isEventsDataFound = false;
				}
				
			});
	}

	async ngOnInit() 
	{	
		
		formInit();
		
		//executes whenever the inout field changes
		this.KeywordCtrl.valueChanges
			.pipe(
			filter(res => {
				return res !== null && res.length >= this.minLengthTerm;
			}),
			distinctUntilChanged(),
			debounceTime(1000),
			tap(() => {
				this.errorMsg = "";
				this.filteredKeywords = [];
				this.isLoading = true;
			}),
			switchMap(value => this.http.get('http://localhost:8000/suggest?keyword=' + value)
				.pipe(
				finalize(() => {
					this.isLoading = false
				}),
				)
			)
			)
			.subscribe((data: any) => {

			if (data['Names'] == undefined) 
			{
				this.errorMsg = data['Error'];
				this.filteredKeywords = [];
			} 
			else 
			{
				console.log(data);
				this.errorMsg = "";
				this.filteredKeywords = data['Names'];
			}
			
			});
	}
}