import { Component, OnInit, ViewEncapsulation, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';

declare function formInit(): any;
declare function ascendingSort(): any;
declare function jsCheckAutoDetect(): any;
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
	//need to change this every now and then
	baseURL = "https://ass8-events.uc.r.appspot.com/server";
	//baseURL = "http://localhost:8080/server";
	events: any = [];
	eventDetails: any;
	venueDetails: any = [];
	isEventsDataFound = false;
	isTabsDataFound = false;
	isEventDetailsDataFound = false;
	noEventDetailsDataFound = false;
	isMusicRelated = false;
	isVenueDataFound = false;
	noVenueDataFound = false;
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
		this.noEventDetailsDataFound = false; 
		this.isMusicRelated = false;
		this.isVenueDataFound = false;
		this.noVenueDataFound = false;
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
			alert("Event Removed from Favorites!");

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
		
		
		if(autoDetectCheckBox.checked)
		{
			jsCheckAutoDetect();
			this.isLocationDisabled = true;
		}
		else
		{
			jsCheckAutoDetect();
			this.isLocationDisabled = false;
		}
	}
	clearForm()
	{
		this.initializeFlags();

		//location field
		const locationObj = document.getElementById('location') as HTMLInputElement;
		locationObj.textContent = "";
		this.isLocationDisabled = false;
		locationObj.required = true;

	}

	getApiCall(url: string){return this.http.get(url);}

	disableArrows(show: boolean)
	{
		console.log("DA: " + show);
		if(!show)
			this.carouselConfig.showNavigationArrows = true;
		else
			this.carouselConfig.showNavigationArrows = false;
	}


	rowClick(id: string, venueName: string)
	{	
		this.artistsInfo = [];

		var eventURL = this.baseURL + "/eventDetails?id=" + id;
		
		fetch(eventURL)
		.then(RESPONSE => RESPONSE.json())
		.then(RES =>
			{
				if('type' in RES && 'message' in RES)
				{	
					if(RES.type == 'error')
					{
						this.noEventDetailsDataFound = true;
						this.isEventDetailsDataFound = false;

						//this.disableArrows(true);
					}
					else
					{
						this.noEventDetailsDataFound = false;
						this.isEventDetailsDataFound = true;
						
						this.eventDetails = RES['message'];
						
						//get artists/team string ready
						let artists = JSON.parse(JSON.stringify(RES)).message.eventArtist;
						let artistString = '';
						for(let i=0; i < artists.length; i++)
						{
							if(i == artists.length - 1)
								artistString = artistString + artists[i].artistName;
							else
								artistString = artistString + artists[i].artistName + " | ";
						}
						
						//get onsale data ready
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
						
						//get favorite icon ready
						var isAlreadySelected = false;
						var favorites = JSON.parse(localStorage.getItem("favorite") || '[]');
						for(let fav of favorites)
							if(fav?.eventId == this.eventDetails?.eventId)
							{
								isAlreadySelected = true;
								break;
							}
						
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
					

						//ARTISTS TAB Population
						let artistCount = 0;
						for(let artist of this.eventDetails.eventArtist)
						{
							if(artist.isMusicRelated)
							{
								this.isMusicRelated = true;
								this.noArtistsFound = false;
								artistCount++;
								
								var artistURL = this.baseURL + "/artistInfo?artist=" + encodeURIComponent(artist.artistName);
								fetch(artistURL)
								.then(res => res.json())
								.then(RES =>
									{
										if(JSON.parse(JSON.stringify(RES)).type != 'error')
											this.artistsInfo.push(JSON.parse(JSON.stringify(RES)).message);

									});
							}
						}
						if (artistCount == 0)
						{
							this.isMusicRelated = false;
							this.noArtistsFound = true;
						}
						//reorder artistsinfo
					}
				}


				var venueURL = this.baseURL + "/venueDetails?venueName=" + encodeURIComponent(venueName);
				fetch(venueURL)
				.then(RESPONSE => RESPONSE.json())
				.then(res =>
					{
						if('type' in res)
						{
							if(res.type == 'error')
							{
								this.noVenueDataFound = true;
								this.isVenueDataFound = false;
							}
							else
							{
								this.noVenueDataFound = false;
								this.isVenueDataFound = true;
								this.venueDetails = JSON.parse(JSON.stringify(res)).message;

								var name = JSON.parse(JSON.stringify(res)).message.venueName;
								var address = JSON.parse(JSON.stringify(res)).message.venueAddress;
								var city = JSON.parse(JSON.stringify(res)).message.venueCity;
								
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

							}
						}
					});

				this.isTabsDataFound = true; //table make display
				this.isEventsDataFound = false;	//results Table no display
			
			
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
		const distance = document.getElementById('distance') as HTMLInputElement;
		const category = document.getElementById('category') as HTMLInputElement | null;

		const finalDistance = distance?.value == '' ? 10 : distance?.value;
		
		var loc = submitForm(location?.value);

		var url = this.baseURL + "/searchEvents?";
		url += 'keyword=' + encodeURIComponent(this.selectedKeyword);
		url += '&distance=' + finalDistance;
		url += '&category=' + category?.value;
		url += '&location=' + encodeURIComponent(loc);

		//fetch events data
		fetch(url)
		.then(RES => RES.json())
		.then(res =>
			{
				//console.log(res);
				if('type' in res)
				{
					if(res['type'] == 'error')
					{
						this.noEventsDataFound = true;
						this.isEventsDataFound = false;
					}
					else
					{
						if('result' in res)
							this.events = res.result;
						
						if(this.events.length > 0)
						{
							this.noEventsDataFound = false;
							this.isEventsDataFound = true;

							for(let i=0; i < this.events.length-1; i++)
							{
								for(let j = 0; j < this.events.length-i-1; j++)
        						{
									var x = this.events[j].date;
									var y = this.events[j+1].date;
									if( x > y)
									{
										var temp = this.events[j];
										this.events[j] = this.events[j+1];
										this.events[j+1] = temp;
									}
								}
							}
						}
						else
						{
							this.noEventsDataFound = true;
							this.isEventsDataFound = false;
						}
					}
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
			switchMap(value => this.http.get(this.baseURL + '/suggest?keyword=' + value)
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