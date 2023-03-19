import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit
{
	isFavorites = false;
	favoritesData: any = [];

	removeFavorite(eventName: any, id: Number)
	{
		alert("Removed from favorites!");
		this.favoritesData.splice(id, 1);
		if(this.favoritesData.length == 0)
			this.isFavorites = false;
		localStorage.setItem('favorite', JSON.stringify(this.favoritesData));

	}

	constructor() 
	{
		if(localStorage.getItem('favorite') != null)
		{
			var favorites = JSON.parse(localStorage.getItem('favorite') || '[]');
			if (favorites.length > 0)
			{
				this.isFavorites = true;
				this.favoritesData = favorites;
			}
		}	
	}

	ngOnInit() 
	{
		console.log("Favorites INIT");
		console.log(this.isFavorites);
	}
}
